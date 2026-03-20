"use client";
import type { BiasCheck } from "@/types";

interface BiasCheckBadgeProps {
  biasCheck: BiasCheck | null;
  compact?: boolean;
}

export function BiasCheckBadge({ biasCheck, compact }: BiasCheckBadgeProps) {
  if (!biasCheck) return (
    <span className="text-[11px] font-mono text-[#6B7280]">
      pending
    </span>
  );

  const { status, delta } = biasCheck;

  if (status === "FAIL" || status === "REVIEW" || delta > 3) {
    return (
      <span className="text-[11px] font-mono text-[#D97706]">
        Δ{delta} · review
      </span>
    );
  }

  return (
    <span className="text-[11px] font-mono text-[#6B7280]">
      Δ{delta} · passed
    </span>
  );
}
