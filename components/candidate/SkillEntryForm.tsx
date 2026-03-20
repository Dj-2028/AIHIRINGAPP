"use client";
import { useState } from "react";
import type { SkillEntry } from "@/types";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";

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
      skill_id: skillName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      learned_from: learnedFrom,
      learned_to: learnedTo || null,
      source,
    });
  };

  const inputClasses = "w-full border border-[#E5E5E3] bg-white px-3 py-2 text-[13px] text-[#1A1A18] focus:border-[#1A1A18] focus:outline-none transition-colors";

  return (
    <form onSubmit={handleSubmit} className="p-6 border border-[#E5E5E3] bg-[#FAFAF9] space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[13px] font-medium text-[#1A1A18] mb-1 block">Skill name</label>
          <input className={inputClasses} value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="e.g. Rust, React" required />
        </div>
        <div>
          <label className="text-[13px] font-medium text-[#1A1A18] mb-1 block">Source</label>
          <select className={inputClasses} value={source} onChange={(e) => setSource(e.target.value as SkillEntry["source"])}>
            <option value="self-reported">Self-reported</option>
            <option value="github">GitHub</option>
            <option value="coursera">Coursera</option>
            <option value="linkedin">LinkedIn</option>
          </select>
        </div>
        <div>
          <label className="text-[13px] font-medium text-[#1A1A18] mb-1 block">Learned from</label>
          <input type="date" className={inputClasses} value={learnedFrom} onChange={(e) => setLearnedFrom(e.target.value)} required />
        </div>
        <div>
          <label className="text-[13px] font-medium text-[#1A1A18] mb-1 block">Learned to (optional)</label>
          <input type="date" className={inputClasses} value={learnedTo} onChange={(e) => setLearnedTo(e.target.value)} min={learnedFrom} />
        </div>
      </div>
      {daysToLearn !== null && daysToLearn > 0 && (
        <p className="text-[11px] font-mono text-[#D97706]">+ {daysToLearn} days to learn</p>
      )}
      <div className="flex gap-4 pt-2">
        <button type="submit" className="btn flex items-center gap-2">
          Save Skill
        </button>
        <button type="button" onClick={onCancel} className="text-[13px] font-medium text-[#6B7280] hover:text-[#1A1A18] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}
