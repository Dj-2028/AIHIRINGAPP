"use client";
import { useState } from "react";
import { GlassBoxPanel } from "./GlassBoxPanel";
import { BiasCheckBadge } from "@/components/shared/BiasCheckBadge";
import type { LeaderboardEntry } from "@/types";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
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
    // Priority 8: Future hook for robust status updating if needed, currently optimistic
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
    <>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(!expanded)}>
        <TableCell className="font-mono text-muted-foreground w-12">{entry.rank ?? "—"}</TableCell>
        <TableCell className="font-medium truncate max-w-[200px]">{name}</TableCell>
        <TableCell className="font-mono text-sm">{hybrid}</TableCell>
        <TableCell className="font-mono text-sm text-muted-foreground">{vel}</TableCell>
        <TableCell className="font-mono text-sm text-muted-foreground">{adj}</TableCell>
        <TableCell className="font-mono text-sm text-muted-foreground">{ttp}</TableCell>
        <TableCell>
          <BiasCheckBadge biasCheck={entry.bias_check} compact />
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-2 pr-1">
            <Button
              size="sm"
              variant={entry.status === "shortlisted" ? "secondary" : "ghost"}
              onClick={handleShortlist}
              disabled={loading}
              className={cn(
                "h-7",
                entry.status === "shortlisted" && "text-amber-600 bg-amber-500/10 hover:bg-amber-500/20"
              )}
            >
              {entry.status === "shortlisted" ? "Listed" : "Shortlist"}
            </Button>
            <div className="text-muted-foreground font-mono w-4 text-center">{expanded ? "−" : "+"}</div>
          </div>
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow className="bg-muted/5 hover:bg-muted/5">
          <TableCell colSpan={8} className="p-0 border-b">
            <GlassBoxPanel entry={entry} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
