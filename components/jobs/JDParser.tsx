"use client";
import { useState } from "react";
import { SkillChipList } from "./SkillChipList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Sparkles } from "lucide-react";
import type { SkillRef } from "@/types";

interface JDParserProps {
  value?: SkillRef[];
  onChange?: (skills: SkillRef[]) => void;
}

export function JDParser({ value = [], onChange }: JDParserProps) {
  const [text, setText] = useState("");
  const [skills, setSkills] = useState<SkillRef[]>(value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState(false);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/jobs/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const all = [...(data.required ?? []), ...(data.nice_to_have ?? [])];
      setSkills(all);
      onChange?.(all);
      setParsed(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = (skill_id: string) => {
    const updated = skills.filter((s) => s.skill_id !== skill_id);
    setSkills(updated);
    onChange?.(updated);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setParsed(false); }}
          placeholder="Paste your job description here… wait for the AI to parse the requirements."
          rows={8}
          className="w-full resize-none border border-[#E5E5E3] bg-[#FAFAF9] p-4 text-[13px] text-[#1A1A18] focus:border-[#1A1A18] outline-none transition-colors"
        />
        <span className="absolute bottom-3 right-3 text-[11px] font-mono text-[#6B7280]">
          {text.length} chars
        </span>
      </div>

      <button
        onClick={handleParse}
        disabled={loading || !text.trim()}
        className="btn flex items-center gap-2"
      >
        {loading ? <LoadingSpinner /> : <Sparkles size={16} />}
        {loading ? "Parsing requirements…" : "Extract Skills"}
      </button>

      {error && <p className="text-[13px] text-red-600 border border-red-200 bg-red-50 p-3">{error}</p>}

      {parsed && skills.length === 0 && (
        <p className="text-[13px] text-[#6B7280]">No skills detected. Try a more detailed job description.</p>
      )}

      {skills.length > 0 && (
        <div className="p-6 border border-[#E5E5E3] bg-[#FAFAF9]">
          <p className="text-[13px] font-medium text-[#1A1A18] mb-4">
            {skills.length} skills extracted (Click × to modify)
          </p>
          <SkillChipList skills={skills} removable onRemove={handleRemove} />
        </div>
      )}
    </div>
  );
}
