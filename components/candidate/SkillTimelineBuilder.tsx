"use client";
import { useState } from "react";
import { SkillEntryForm } from "./SkillEntryForm";
import { Trash2 } from "lucide-react";
import type { SkillEntry } from "@/types";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SkillTimelineBuilderProps {
  entries: SkillEntry[];
  candidateId: string;
  onEntriesChange?: (entries: SkillEntry[]) => void;
}

export function SkillTimelineBuilder({ entries: initial, candidateId, onEntriesChange }: SkillTimelineBuilderProps) {
  const [entries, setEntries] = useState<SkillEntry[]>(initial);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (entry: Omit<SkillEntry, "id" | "created_at">) => {
    setSaving(true);
    const res = await fetch("/api/skill-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (res.ok) {
      const saved = await res.json();
      const updated = [...entries, saved];
      setEntries(updated);
      onEntriesChange?.(updated);
      
      // Feature Audit [Priority 4]: Trigger score regeneration whenever timelines shift
      fetch("/api/candidates/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
    }
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/skill-entries/${id}`, { method: "DELETE" });
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    onEntriesChange?.(updated);
    
    // Also trigger on delete
    fetch("/api/candidates/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId }),
    });
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 && !showForm && (
        <Card className="text-center py-10 shadow-none border-dashed bg-muted/20">
          <p className="text-sm text-muted-foreground">No skills added yet.</p>
        </Card>
      )}

      {entries.map((e) => (
        <Card
          key={e.id}
          className="flex items-center justify-between p-4 shadow-none rounded-md"
        >
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium mb-0.5">{e.skill_name}</p>
              <p className="text-xs font-mono text-muted-foreground">
                {format(new Date(e.learned_from), "MMM yyyy")}
                {e.learned_to && ` -> ${format(new Date(e.learned_to), "MMM yyyy")}`}
                {e.days_to_learn && ` · ${e.days_to_learn}d`}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive shrink-0">
            <Trash2 size={16} />
          </Button>
        </Card>
      ))}

      {showForm && (
        <SkillEntryForm
          candidateId={candidateId}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          disabled={saving}
        >
          Add Skill
        </Button>
      )}
    </div>
  );
}
