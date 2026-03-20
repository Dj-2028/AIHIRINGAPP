import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { calculateVelocityScore } from "@/lib/scoring/velocity";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { candidateId } = await req.json();
    if (!candidateId) return NextResponse.json({ error: "candidateId required" }, { status: 400 });

    // Fetch skill entries
    const { data: entries, error: eErr } = await supabase
      .from("skill_entries")
      .select("*")
      .eq("candidate_id", candidateId)
      .order("learned_from", { ascending: true });

    if (eErr) throw eErr;
    if (!entries || entries.length === 0) {
      return NextResponse.json({ error: "No skill entries" }, { status: 400 });
    }

    // Get cohort data for percentile
    const { data: cohort } = await supabase
      .from("candidates")
      .select("skills_per_year")
      .not("skills_per_year", "is", null);

    const cohortValues = (cohort ?? []).map((c: { skills_per_year: number | null }) => c.skills_per_year);

    const { velocityScore, skillsPerYear, percentile } = calculateVelocityScore(entries, cohortValues);

    // Update candidate row
    await supabase
      .from("candidates")
      .update({
        velocity_score: velocityScore,
        skills_per_year: skillsPerYear,
        cohort_percentile: percentile,
        last_calculated: new Date().toISOString(),
      })
      .eq("id", candidateId);

    return NextResponse.json({ velocityScore, skillsPerYear, percentile });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
