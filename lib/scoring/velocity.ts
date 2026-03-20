import type { SkillEntry } from "@/types";

export function calculateVelocityScore(
  entries: SkillEntry[],
  cohortSkillsPerYear: (number | null)[]
): { velocityScore: number; skillsPerYear: number; percentile: number } {
  if (!entries || entries.length === 0) {
    return { velocityScore: 50, skillsPerYear: 0, percentile: 50 };
  }

  // Sort by date and calculate span
  const sorted = [...entries].sort(
    (a, b) =>
      new Date(a.learned_from).getTime() - new Date(b.learned_from).getTime()
  );

  const first = new Date(sorted[0].learned_from);
  const last = new Date(sorted[sorted.length - 1].learned_from);
  const yearsSpan = Math.max(
    (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 365),
    0.5 // minimum 6 months to avoid division inflation
  );

  const skillsPerYear = entries.length / yearsSpan;

  // Cohort percentile
  const validCohort = cohortSkillsPerYear.filter(
    (v): v is number => v !== null && v !== undefined
  );
  const below = validCohort.filter((v) => v < skillsPerYear).length;
  const percentile =
    validCohort.length > 0 ? (below / validCohort.length) * 100 : 50;

  const velocityScore = Math.min(100, Math.round(percentile));

  return {
    velocityScore,
    skillsPerYear: Math.round(skillsPerYear * 10) / 10,
    percentile: Math.round(percentile),
  };
}
