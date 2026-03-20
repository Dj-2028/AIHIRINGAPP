// supabase/functions/recalculate-scores/index.ts
// Triggered via DB webhook after skill_entries INSERT or UPDATE
// Recalculates velocity_score, skills_per_year, cohort_percentile for a candidate

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SkillEntry {
  learned_from: string;
  days_to_learn: number | null;
}

interface CandidateRow {
  skills_per_year: number | null;
}

function calcPercentile(value: number, cohortValues: number[]): number {
  if (cohortValues.length === 0) return 50;
  const below = cohortValues.filter((v) => v < value).length;
  return (below / cohortValues.length) * 100;
}

Deno.serve(async (req: Request) => {
  try {
    const { candidateId } = await req.json();

    if (!candidateId) {
      return new Response(
        JSON.stringify({ error: "candidateId is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Fetch all skill entries for candidate
    const { data: entries, error: entriesError } = await supabase
      .from("skill_entries")
      .select("learned_from, days_to_learn")
      .eq("candidate_id", candidateId)
      .order("learned_from", { ascending: true });

    if (entriesError) throw entriesError;
    if (!entries || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "No skill entries found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Calculate years span (min 6 months)
    const first = new Date((entries as SkillEntry[])[0].learned_from);
    const last = new Date((entries as SkillEntry[])[entries.length - 1].learned_from);
    const yearsSpan = Math.max(
      (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 365),
      0.5
    );

    const skillsPerYear = entries.length / yearsSpan;

    // 3. Get cohort for percentile
    const { data: cohort } = await supabase
      .from("candidates")
      .select("skills_per_year")
      .not("skills_per_year", "is", null);

    const cohortValues = ((cohort as CandidateRow[]) || [])
      .map((c) => c.skills_per_year)
      .filter((v): v is number => v !== null);

    const percentile = calcPercentile(skillsPerYear, cohortValues);
    const velocityScore = Math.min(100, Math.round(percentile));

    // 4. Update candidates row
    const { error: updateError } = await supabase
      .from("candidates")
      .update({
        velocity_score: velocityScore,
        skills_per_year: Math.round(skillsPerYear * 10) / 10,
        cohort_percentile: Math.round(percentile),
        last_calculated: new Date().toISOString(),
      })
      .eq("id", candidateId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ velocityScore, skillsPerYear, percentile }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
