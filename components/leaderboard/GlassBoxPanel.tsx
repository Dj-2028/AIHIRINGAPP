"use client";
import { useState } from "react";
import { ScoreBreakdownBar } from "./ScoreBreakdownBar";
import { LearningTimelineChart } from "./LearningTimelineChart";
import { BiasCheckPanel } from "./BiasCheckPanel";
import type { LeaderboardEntry } from "@/types";
import { cn } from "@/lib/utils";

type Tab = "breakdown" | "timeline" | "bias";

interface GlassBoxPanelProps { entry: LeaderboardEntry }

export function GlassBoxPanel({ entry }: GlassBoxPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("breakdown");

  const tabs: { id: Tab; label: string }[] = [
    { id: "breakdown", label: "Score Breakdown" },
    { id: "timeline",  label: "Learning Timeline" },
    { id: "bias",      label: "Bias Check" },
  ];

  const chain = entry.explanation_chain;
  const adj = entry.adjacency_score ?? 0;
  const vel = entry.velocity_score ?? 0;
  const hybrid = Math.round(adj * 0.4 + vel * 0.6);

  return (
    <div className="p-6 bg-white">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-[#E5E5E3]">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              "pb-2 text-[13px] font-medium transition-colors border-b-2 -mb-[1px]",
              activeTab === t.id
                ? "border-[#1A1A18] text-[#1A1A18]"
                : "border-transparent text-[#6B7280] hover:text-[#1A1A18]"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[180px]">
        {activeTab === "breakdown" && (
          <div className="space-y-6">
            <ScoreBreakdownBar adjacencyScore={adj} velocityScore={vel} hybridScore={hybrid} />
            {chain && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
                <div className="p-4 border border-[#E5E5E3] space-y-3 bg-[#FAFAF9]">
                  <p className="font-medium text-[#1A1A18]">Skill Match details</p>
                  {chain.current_skills.matched.length > 0 && (
                    <p className="text-[#6B7280]">Matched: {chain.current_skills.matched.join(", ")}</p>
                  )}
                  {chain.current_skills.missing.length > 0 && (
                    <p className="text-[#6B7280]">Missing: {chain.current_skills.missing.join(", ")}</p>
                  )}
                  <p className="text-[#6B7280] italic leading-relaxed">{chain.current_skills.adjacency_note}</p>
                </div>
                <div className="p-4 border border-[#E5E5E3] space-y-3 bg-[#FAFAF9]">
                  <p className="font-medium text-[#1A1A18]">Time to Productivity</p>
                  <p className="text-[20px] font-mono text-[#1A1A18]">{chain.time_to_productivity.estimate_weeks}</p>
                  <p className="text-[#6B7280] leading-relaxed">{chain.time_to_productivity.basis}</p>
                  <p className="text-[#6B7280]">Fastest area: {chain.velocity.fastest_acquisition}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <LearningTimelineChart entries={entry.candidates?.skill_entries ?? []} />
        )}

        {activeTab === "bias" && (
          <BiasCheckPanel biasCheck={entry.bias_check} />
        )}
      </div>
    </div>
  );
}
