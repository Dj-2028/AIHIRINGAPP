"use client";
import { useState } from "react";
import { CandidateRow } from "./CandidateRow";
import type { LeaderboardEntry } from "@/types";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";

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
    <button onClick={() => handleSort(k)} className="flex items-center gap-1 hover:text-foreground transition-colors outline-none">
      {label}{sortKey === k ? (asc ? " ↑" : " ↓") : ""}
    </button>
  );

  if (entries.length === 0) {
    return (
      <Card className="py-16 flex flex-col items-center shadow-none bg-muted/20 border-dashed">
        <p className="text-sm font-medium text-foreground mb-1">No applications yet</p>
        <p className="text-sm text-muted-foreground">Candidates who apply will appear here ranked by learning velocity.</p>
      </Card>
    );
  }

  return (
    <div className="rounded-md border bg-card overflow-x-auto">
      <Table className="min-w-[700px] md:min-w-full">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Candidate</TableHead>
            <TableHead><ColHeader k="hybrid" label="Score" /></TableHead>
            <TableHead><ColHeader k="velocity" label="Vel." /></TableHead>
            <TableHead><ColHeader k="adjacency" label="Adj." /></TableHead>
            <TableHead>ETA</TableHead>
            <TableHead>Bias</TableHead>
            <TableHead className="text-right pr-4">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((entry) => (
            <CandidateRow key={entry.id} entry={entry} onStatusChange={handleStatusChange} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
