import type { SkillRef } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Calculate adjacency score for a candidate against a job's required skills.
 * Uses the precomputed skill_adjacency table.
 */
export async function calculateAdjacencyScore(
  candidateSkillIds: string[],
  requiredSkills: SkillRef[],
  supabase: SupabaseClient
): Promise<{ score: number; maxAdjacency: number; breakdown: Record<string, number> }> {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { score: 0, maxAdjacency: 0, breakdown: {} };
  }

  const breakdown: Record<string, number> = {};
  let totalWeightedScore = 0;
  let totalWeight = 0;
  let maxAdjacency = 0;

  for (const req of requiredSkills) {
    const weight = req.weight ?? 1;
    totalWeight += weight;

    // Exact match
    if (candidateSkillIds.includes(req.skill_id)) {
      breakdown[req.skill_name] = 100;
      totalWeightedScore += 100 * weight;
      maxAdjacency = Math.max(maxAdjacency, 100);
      continue;
    }

    // Check adjacency table
    if (candidateSkillIds.length > 0) {
      const { data: adj } = await supabase
        .from("skill_adjacency")
        .select("similarity")
        .eq("skill_a", req.skill_id)
        .in("skill_b", candidateSkillIds)
        .order("similarity", { ascending: false })
        .limit(1)
        .maybeSingle();

      const sim = adj ? Math.round((adj.similarity as number) * 100) : 0;
      breakdown[req.skill_name] = sim;
      totalWeightedScore += sim * weight;
      maxAdjacency = Math.max(maxAdjacency, sim);
    } else {
      breakdown[req.skill_name] = 0;
    }
  }

  const score = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;
  return { score, maxAdjacency, breakdown };
}
