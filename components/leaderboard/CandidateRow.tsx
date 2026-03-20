"use client";
import { useState } from "react";
import { GlassBoxPanel } from "./GlassBoxPanel";
import { BiasCheckBadge } from "@/components/shared/BiasCheckBadge";
import type { LeaderboardEntry } from "@/types";
import { cn } from "@/lib/utils";

interface CandidateRowProps {
  entry: LeaderboardEntry;
  onStatusChange?: (id: string, status: string) => void;
}

export function CandidateRow({ entry, onStatusChange }: CandidateRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const name = entry.candidates?.users?.full_name ?? entry.candidates?.users?.email ?? "Unknown";
  const adj = entry.adjacency_score ?? 0;
  const vel = entry.velocity_score ?? 0;
  const hybrid = Math.round(adj * 0.4 + vel * 0.6);
  const ttp = entry.explanation_chain?.time_to_productivity?.estimate_weeks ?? "—";

  const handleShortlist = async () => {
    setLoading(true);
    const newStatus = entry.status === "shortlisted" ? "applied" : "shortlisted";
    await fetch(`/api/applications/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onStatusChange?.(entry.id, newStatus);
    setLoading(false);
  };

  return (
    <div className="border-b border-[#E5E5E3] transition-colors hover:bg-[#F5F5F3] bg-[#FAFAF9]">
      <div
        className="grid items-center px-4 h-[48px] gap-4 cursor-pointer"
        style={{ gridTemplateColumns: "40px minmax(150px, 1fr) 80px 80px 80px 100px 120px 80px" }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="text-[13px] font-mono text-[#6B7280]">
          {entry.rank ?? "—"}
        </div>
        <div className="truncate pr-4">
          <p className="font-medium text-[13px] text-[#1A1A18] truncate">{name}</p>
        </div>
        <div className="text-[13px] font-mono font-medium text-[#1A1A18]">
          {hybrid}
        </div>
        <div className="text-[13px] font-mono text-[#6B7280]">
          {vel}
        </div>
        <div className="text-[13px] font-mono text-[#6B7280]">
          {adj}
        </div>
        <div className="text-[13px] font-mono text-[#6B7280]">
          {ttp}
        </div>
        <div>
          <BiasCheckBadge biasCheck={entry.bias_check} compact />
        </div>
        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleShortlist}
            disabled={loading}
            className={cn(
              "text-[11px] font-medium transition-colors border border-transparent px-2 py-1 -ml-2",
              entry.status === "shortlisted" ? "text-[#D97706] bg-[#D97706]/10 border-[#D97706]/20" : "text-[#1A1A18] hover:bg-[#E5E5E3]"
            )}
          >
            {entry.status === "shortlisted" ? "Listed" : "Shortlist"}
          </button>
          <div className="text-[#6B7280] font-mono text-[16px] pl-2">{expanded ? "−" : "+"}</div>
        </div>
      </div>

      {expanded && (
        <div className="bg-white border-t border-[#E5E5E3]">
          <GlassBoxPanel entry={entry} />
        </div>
      )}
    </div>
  );
}
