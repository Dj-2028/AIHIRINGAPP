import type { SkillEntry } from "@/types";

/**
 * Estimate time-to-productivity for a missing skill.
 * Based on the candidate's average learning speed and the adjacency score.
 */
export function estimateTimeToProductivity(
  entries: SkillEntry[],
  maxAdjacency: number // 0–100
): string {
  const withDuration = entries.filter(
    (e) => e.days_to_learn != null && e.days_to_learn > 0
  );

  if (withDuration.length === 0) {
    return "4–6 weeks"; // fallback default
  }

  const avgDays =
    withDuration.reduce((sum, e) => sum + (e.days_to_learn ?? 0), 0) /
    withDuration.length;

  // The closer the adjacency match, the faster they'll learn
  // adjacency 100 → factor 0 (already knows it)
  // adjacency 70  → factor 0.3 reduction
  // adjacency 0   → full avg time
  const adjacencyFactor = Math.max(0, (100 - maxAdjacency) / 100);
  const estimatedDays = Math.max(7, Math.round(avgDays * adjacencyFactor));

  const weeks = estimatedDays / 7;
  const low = Math.max(1, Math.round(weeks * 0.8));
  const high = Math.round(weeks * 1.2);

  return `${low}–${high} weeks`;
}
