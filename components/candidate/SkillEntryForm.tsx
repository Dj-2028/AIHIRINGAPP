"use client";
import { useState } from "react";
import type { SkillEntry } from "@/types";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SkillEntryFormProps {
  onSave: (entry: Omit<SkillEntry, "id" | "created_at">) => void;
  onCancel: () => void;
  candidateId: string;
}

export function SkillEntryForm({ onSave, onCancel, candidateId }: SkillEntryFormProps) {
  const [skillName, setSkillName] = useState("");
  const [learnedFrom, setLearnedFrom] = useState("");
  const [learnedTo, setLearnedTo] = useState("");
  const [source, setSource] = useState<SkillEntry["source"]>("self-reported");

  const daysToLearn =
    learnedFrom && learnedTo
      ? Math.round((new Date(learnedTo).getTime() - new Date(learnedFrom).getTime()) / (1000 * 60 * 60 * 24))
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName || !learnedFrom) return;
    onSave({
      candidate_id: candidateId,
      skill_name: skillName,
      // Priority 3 fallback: currently uses slug. The API must resolve this or UI must send valid UUID.
      skill_id: skillName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      learned_from: learnedFrom,
      learned_to: learnedTo || null,
      source,
    });
  };

  return (
    <Card className="shadow-none">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Skill name</Label>
              <Input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. Rust, React" required />
            </div>
            <div className="space-y-2">
              <Label>Source</Label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" 
                value={source} 
                onChange={(e) => setSource(e.target.value as SkillEntry["source"])}
              >
                <option value="self-reported">Self-reported</option>
                <option value="github">GitHub</option>
                <option value="coursera">Coursera</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Learned from</Label>
              <Input type="date" value={learnedFrom} onChange={(e) => setLearnedFrom(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Learned to (optional)</Label>
              <Input type="date" value={learnedTo} onChange={(e) => setLearnedTo(e.target.value)} min={learnedFrom} />
            </div>
          </div>
          
          {daysToLearn !== null && daysToLearn > 0 && (
            <p className="text-xs font-mono text-muted-foreground">+ {daysToLearn} days to learn</p>
          )}
          
          <div className="flex gap-4 pt-2">
            <Button type="submit">
              Save Skill
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
