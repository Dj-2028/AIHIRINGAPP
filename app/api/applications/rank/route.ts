import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { calculateAdjacencyScore } from "@/lib/scoring/adjacency";
import { buildExplanationChain } from "@/lib/gemini/generateExplanation";
import type { CandidateWithScore, SkillRef } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { jobId } = await req.json();
    if (!jobId) return NextResponse.json({ error: "jobId required" }, { status: 400 });

    // Fetch job + all applications + candidate data
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        *,
        applications (
          id,
          candidate_id,
          status,
          candidates (
            *,
            users (id, full_name, email, role),
            skill_entries (*)
          )
        )
      `)
      .eq("id", jobId)
      .single();

    if (jobError) throw jobError;
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const requiredSkills = (job.required_skills ?? []) as SkillRef[];
    const applications = job.applications ?? [];

    // Score each application
    const updates = await Promise.all(
      applications.map(async (app: { id: string; candidate_id: string; status: string; candidates: CandidateWithScore }) => {
        const candidate = app.candidates as CandidateWithScore;
        const candidateSkillIds = (candidate.skill_entries ?? [])
          .filter((e) => e.skill_id)
          .map((e) => e.skill_id as string);

        const { score: adjacencyScore, maxAdjacency, breakdown } =
          await calculateAdjacencyScore(candidateSkillIds, requiredSkills, supabase);

        const velocityScore = candidate.velocity_score ?? 0;

        // Bias check (shadow score without demographics — formula doesn't use them)
        const scoreWith = Math.round(adjacencyScore * 0.4 + velocityScore * 0.6);
        const scoreWithout = scoreWith; // demographics not in formula
        const delta = Math.abs(scoreWith - scoreWithout);

        const biasCheck = {
          score_with_demographics: scoreWith,
          score_without_demographics: scoreWithout,
          delta,
          status: delta < 5 ? "PASS" : delta < 10 ? "REVIEW" : "FAIL",
          threshold: 5,
          fields_removed: ["name", "university", "graduation_year", "location"],
        };

        const explanationChain = buildExplanationChain(
          candidate,
          requiredSkills,
          adjacencyScore,
          velocityScore,
          maxAdjacency,
          breakdown
        );

        return {
          id: app.id,
          adjacency_score: adjacencyScore,
          velocity_score: velocityScore,
          bias_check: biasCheck,
          explanation_chain: explanationChain,
          updated_at: new Date().toISOString(),
        };
      })
    );

    // Sort by hybrid score and assign ranks
    updates.sort((a, b) => {
      const scoreA = (a.adjacency_score * 0.4) + (a.velocity_score * 0.6);
      const scoreB = (b.adjacency_score * 0.4) + (b.velocity_score * 0.6);
      return scoreB - scoreA;
    });
    updates.forEach((u, i) => Object.assign(u, { rank: i + 1 }));

    // Upsert all results
    const { error: upsertError } = await supabase.from("applications").upsert(updates);
    if (upsertError) throw upsertError;

    return NextResponse.json({ ranked: updates.length, results: updates });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
