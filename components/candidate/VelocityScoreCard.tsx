"use client";
import type { CandidateProfile } from "@/types";

interface VelocityScoreCardProps { candidate: CandidateProfile; fastestSkill?: string }

export function VelocityScoreCard({ candidate, fastestSkill }: VelocityScoreCardProps) {
  const score = candidate.velocity_score ?? 0;
  const pct = candidate.cohort_percentile ?? 0;
  const spy = candidate.skills_per_year ?? 0;

  return (
    <div className="pt-8 pb-12">
      <div className="mb-4">
        <span className="velocity-score-huge">{score}</span>
      </div>
      <div className="text-[13px] text-[#1A1A18] leading-relaxed max-w-sm">
        Acquiring {spy.toFixed(1)} skills per year. {fastestSkill ? `Fastest area is ${fastestSkill}.` : ""}
        <br />
        Sitting in the top {Math.round(100 - pct)}% of the current cohort.
      </div>
    </div>
  );
}
