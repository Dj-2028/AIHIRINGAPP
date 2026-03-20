"use client";

interface ScoreBreakdownBarProps {
  adjacencyScore: number;
  velocityScore: number;
  hybridScore: number;
}

export function ScoreBreakdownBar({ adjacencyScore, velocityScore, hybridScore }: ScoreBreakdownBarProps) {
  // We will display just the primary hybrid score to match the new strict UI requirements, 
  // keeping the props invariant so we don't break parent imports.
  return (
    <div className="flex items-center gap-3">
      <span className="score-mono">{hybridScore}</span>
      <div className="score-bar-bg relative">
        <div 
          className="score-bar-fill absolute top-0 left-0 transition-all duration-300" 
          style={{ width: `${hybridScore}%` }}
        />
      </div>
    </div>
  );
}
