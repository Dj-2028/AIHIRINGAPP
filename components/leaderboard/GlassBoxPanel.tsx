"use client";
import { ScoreBreakdownBar } from "./ScoreBreakdownBar";
import { LearningTimelineChart } from "./LearningTimelineChart";
import { BiasCheckPanel } from "./BiasCheckPanel";
import type { LeaderboardEntry } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

interface GlassBoxPanelProps { entry: LeaderboardEntry }

export function GlassBoxPanel({ entry }: GlassBoxPanelProps) {
  const chain = entry.explanation_chain;
  const adj = entry.adjacency_score ?? 0;
  const vel = entry.velocity_score ?? 0;
  const hybrid = Math.round(adj * 0.4 + vel * 0.6);

  return (
    <div className="p-6 bg-background">
      <Tabs defaultValue="breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/50 border border-border">
          <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
          <TabsTrigger value="timeline">Learning Timeline</TabsTrigger>
          <TabsTrigger value="bias">Bias Check</TabsTrigger>
        </TabsList>
        
        <div className="mt-6 min-h-[200px]">
          <TabsContent value="breakdown" className="space-y-6 mt-0">
            <ScoreBreakdownBar adjacencyScore={adj} velocityScore={vel} hybridScore={hybrid} />
            
            {chain ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <Card className="shadow-none border-dashed bg-muted/20">
                  <CardContent className="p-4 space-y-3">
                    <p className="font-medium text-foreground">Skill Match Details</p>
                    {chain.current_skills?.matched?.length > 0 && (
                      <p className="text-muted-foreground">Matched: {chain.current_skills.matched.join(", ")}</p>
                    )}
                    {chain.current_skills?.missing?.length > 0 && (
                      <p className="text-muted-foreground">Missing: {chain.current_skills.missing.join(", ")}</p>
                    )}
                    <p className="text-muted-foreground italic leading-relaxed">{chain.current_skills?.adjacency_note || "No specific notes provided."}</p>
                  </CardContent>
                </Card>
                <Card className="shadow-none border-dashed bg-muted/20">
                  <CardContent className="p-4 space-y-3">
                    <p className="font-medium text-foreground">Time to Productivity</p>
                    <p className="text-2xl font-mono text-foreground">{chain.time_to_productivity?.estimate_weeks || "—"}</p>
                    <p className="text-muted-foreground leading-relaxed">{chain.time_to_productivity?.basis || "Analysis not available."}</p>
                    {chain.velocity?.fastest_acquisition && (
                      <p className="text-muted-foreground">Fastest area: {chain.velocity.fastest_acquisition}</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="shadow-none border-dashed bg-muted/20 flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Detailed analytical breakdown is currently unavailable.</p>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="timeline" className="mt-0">
            {/* Priority 7: Feature Audit Fix for empty skill arrays causing Recharts crash */}
            {(!entry.candidates?.skill_entries || entry.candidates.skill_entries.length === 0) ? (
               <Card className="flex flex-col items-center justify-center py-12 shadow-none border-dashed bg-muted/20">
                 <p className="text-sm text-muted-foreground">No timeline data available for this candidate.</p>
               </Card>
            ) : (
               <LearningTimelineChart entries={entry.candidates.skill_entries} />
            )}
          </TabsContent>
          
          <TabsContent value="bias" className="mt-0">
            <BiasCheckPanel biasCheck={entry.bias_check} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
