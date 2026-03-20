"use client";
import { useState } from "react";
import { SkillEntryForm } from "./SkillEntryForm";
import { Trash2, Plus, Calendar } from "lucide-react";
import type { SkillEntry } from "@/types";
import { format } from "date-fns";

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
    }
    setShowForm(false);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/skill-entries/${id}`, { method: "DELETE" });
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    onEntriesChange?.(updated);
  };

  return (
    <div className="space-y-3">
      {entries.length === 0 && !showForm && (
        <div className="text-center py-10 border border-[#E5E5E3] bg-[#FAFAF9] text-[#6B7280]">
          <p className="text-[13px]">No skills added yet.</p>
        </div>
      )}

      {entries.map((e) => (
        <div
          key={e.id}
          className="flex items-center justify-between p-4 border border-[#E5E5E3] bg-[#FAFAF9]"
        >
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[13px] font-medium text-[#1A1A18] mb-0.5">{e.skill_name}</p>
              <p className="text-[11px] font-mono text-[#6B7280]">
                {format(new Date(e.learned_from), "MMM yyyy")}
                {e.learned_to && ` -> ${format(new Date(e.learned_to), "MMM yyyy")}`}
                {e.days_to_learn && ` · ${e.days_to_learn}d`}
              </p>
            </div>
          </div>
          <button onClick={() => handleDelete(e.id)} className="text-[#6B7280] hover:text-[#1A1A18] transition-colors">
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {showForm && (
        <SkillEntryForm
          candidateId={candidateId}
          onSave={handleSave}
          onCancel={() => setShowForm(false)}
        />
      )}

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn"
        >
          Add Skill
        </button>
      )}
    </div>
  );
}
