import type {
  CandidateWithScore,
  ExplanationChain,
  SkillRef,
} from "@/types";
import { estimateTimeToProductivity } from "@/lib/scoring/timeToProductivity";

export function buildExplanationChain(
  candidate: CandidateWithScore,
  requiredSkills: SkillRef[],
  adjacencyScore: number,
  velocityScore: number,
  maxAdjacency: number,
  breakdown: Record<string, number>
): ExplanationChain {
  const entries = candidate.skill_entries ?? [];
  const candidateSkillIds = entries
    .filter((e) => e.skill_id)
    .map((e) => e.skill_id as string);

  const matched = requiredSkills
    .filter((r) => candidateSkillIds.includes(r.skill_id))
    .map((r) => r.skill_name);

  const missing = requiredSkills
    .filter((r) => !candidateSkillIds.includes(r.skill_id))
    .map((r) => r.skill_name);

  // Best adjacent note
  const topAdjacentSkill = Object.entries(breakdown)
    .filter(([name]) => !matched.includes(name))
    .sort(([, a], [, b]) => b - a)[0];

  const adjacencyNote = topAdjacentSkill
    ? `Strongest adjacent match: ${topAdjacentSkill[0]} at ${topAdjacentSkill[1]}% similarity`
    : matched.length > 0
    ? "Has exact matches for required skills"
    : "No direct skill matches found";

  // Fastest acquisition
  const withDuration = entries
    .filter((e) => e.days_to_learn != null && e.days_to_learn > 0)
    .sort((a, b) => (a.days_to_learn ?? 999) - (b.days_to_learn ?? 999));

  const fastestEntry = withDuration[0];
  const fastestAcquisition = fastestEntry
    ? `${fastestEntry.skill_name} in ${fastestEntry.days_to_learn} days`
    : "N/A";

  const ttpEstimate = estimateTimeToProductivity(entries, maxAdjacency);
  const avgDays =
    withDuration.length > 0
      ? Math.round(
          withDuration.reduce((s, e) => s + (e.days_to_learn ?? 0), 0) /
            withDuration.length
        )
      : null;

  return {
    match_score: Math.round(adjacencyScore * 0.4 + velocityScore * 0.6),
    current_skills: { matched, missing, adjacency_note: adjacencyNote },
    velocity: {
      score: velocityScore,
      skills_per_year: candidate.skills_per_year,
      cohort_percentile: candidate.cohort_percentile,
      fastest_acquisition: fastestAcquisition,
    },
    time_to_productivity: {
      estimate_weeks: ttpEstimate,
      basis: avgDays
        ? `Based on avg ${avgDays} days per adjacent skill learned`
        : "Estimated from skill adjacency score",
    },
  };
}
