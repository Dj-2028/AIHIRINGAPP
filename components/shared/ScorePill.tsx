"use client";
import { cn } from "@/lib/utils";

interface ScorePillProps {
  score: number;
  label: string;
  color?: "brand" | "amber" | "green" | "muted";
  size?: "sm" | "md" | "lg";
}

export function ScorePill({ score, label, size = "md" }: ScorePillProps) {
  const sizeClass = size === "lg" ? "text-[32px] px-4 py-2" : size === "sm" ? "text-[16px] px-2 py-0.5" : "text-[24px] px-3 py-1";

  return (
    <div className="flex flex-col items-center gap-1 border border-[#E5E5E3] bg-[#FAFAF9] p-3 min-w-[80px]">
      <span
        className={cn("font-mono font-medium text-[#1A1A18] leading-none", sizeClass)}
      >
        {score}
      </span>
      <span className="text-[11px] text-[#6B7280] font-mono uppercase">{label}</span>
    </div>
  );
}
