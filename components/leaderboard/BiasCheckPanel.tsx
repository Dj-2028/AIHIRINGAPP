"use client";
import { BiasCheckBadge } from "@/components/shared/BiasCheckBadge";
import type { BiasCheck } from "@/types";

interface BiasCheckPanelProps { biasCheck: BiasCheck | null }

export function BiasCheckPanel({ biasCheck }: BiasCheckPanelProps) {
  if (!biasCheck) return (
    <div className="text-center py-8 text-[13px] text-[#6B7280]">
      No bias check data yet. Run ranking to generate.
    </div>
  );

  const { score_with_demographics, score_without_demographics, delta, status, fields_removed } = biasCheck;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6 max-w-sm">
        {[
          { label: "Without Demographics", score: score_without_demographics },
          { label: "With Demographics", score: score_with_demographics },
        ].map(({ label, score }) => (
          <div key={label} className="p-4 border border-[#E5E5E3] bg-[#FAFAF9]">
            <div className="text-[24px] font-mono font-medium text-[#1A1A18] mb-1">{score}</div>
            <div className="text-[13px] text-[#6B7280]">{label}</div>
          </div>
        ))}
      </div>

      <div className="border border-[#E5E5E3] bg-[#FAFAF9] p-4 max-w-sm">
        <p className="text-[13px] font-medium text-[#1A1A18] mb-2 border-b border-[#E5E5E3] pb-2">Score Analysis</p>
        <div className="flex justify-between items-center mb-4">
          <span className="text-[13px] text-[#6B7280]">Total Variance</span>
          <span className="font-mono text-[13px] text-[#1A1A18]">Δ{delta} points</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[13px] text-[#6B7280]">Status</span>
          <BiasCheckBadge biasCheck={biasCheck} />
        </div>
      </div>

      <div className="max-w-sm">
        <p className="text-[13px] text-[#1A1A18] mb-2 font-medium">Fields removed for calculation:</p>
        <div className="flex flex-wrap gap-2">
          {fields_removed.map((f) => (
            <span key={f} className="text-[13px] font-mono px-2 border border-[#E5E5E3] bg-white text-[#6B7280]">
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
