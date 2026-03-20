"use client";
import { useState } from "react";
import { CandidateRow } from "./CandidateRow";
import type { LeaderboardEntry } from "@/types";
import { cn } from "@/lib/utils";

interface LeaderboardTableProps { entries: LeaderboardEntry[] }

type SortKey = "hybrid" | "velocity" | "adjacency";

export function LeaderboardTable({ entries: initialEntries }: LeaderboardTableProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [sortKey, setSortKey] = useState<SortKey>("hybrid");
  const [asc, setAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setAsc(!asc);
    else { setSortKey(key); setAsc(false); }
  };

  const sorted = [...entries].sort((a, b) => {
    const getVal = (e: LeaderboardEntry) => {
      if (sortKey === "hybrid") return (e.adjacency_score ?? 0) * 0.4 + (e.velocity_score ?? 0) * 0.6;
      if (sortKey === "velocity") return e.velocity_score ?? 0;
      return e.adjacency_score ?? 0;
    };
    return asc ? getVal(a) - getVal(b) : getVal(b) - getVal(a);
  });

  const handleStatusChange = (id: string, status: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, status: status as LeaderboardEntry["status"] } : e));
  };

  const ColHeader = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => handleSort(k)} className="text-[13px] font-medium flex items-center gap-1 hover:underline transition-colors text-[#1A1A18] text-left">
      {label}{sortKey === k ? (asc ? " ↑" : " ↓") : ""}
    </button>
  );

  if (entries.length === 0) {
    return (
      <div className="py-16">
        <p className="text-[13px] font-medium text-[#1A1A18] mb-1">No applications yet</p>
        <p className="text-[13px] text-[#6B7280]">Candidates who apply will appear here ranked by learning velocity.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#E5E5E3] bg-[#FAFAF9]">
      {/* Header */}
      <div
        className="grid px-4 py-3 sticky top-0 z-10 bg-[#FAFAF9] border-b border-[#1A1A18]"
        style={{ gridTemplateColumns: "40px minmax(150px, 1fr) 80px 80px 80px 100px 120px 80px" }}
      >
        <span className="text-[13px] font-medium text-[#1A1A18]">#</span>
        <span className="text-[13px] font-medium text-[#1A1A18]">Candidate</span>
        <ColHeader k="hybrid" label="Score" />
        <ColHeader k="velocity" label="Vel." />
        <ColHeader k="adjacency" label="Adj." />
        <span className="text-[13px] font-medium text-[#1A1A18]">ETA</span>
        <span className="text-[13px] font-medium text-[#1A1A18]">Bias</span>
        <span className="text-[13px] font-medium text-[#1A1A18]">Action</span>
      </div>

      <div>
        {sorted.map((entry) => (
          <CandidateRow key={entry.id} entry={entry} onStatusChange={handleStatusChange} />
        ))}
      </div>
    </div>
  );
}
