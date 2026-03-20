"use client";
import { useState } from "react";
import { SkillChipList } from "./SkillChipList";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Sparkles } from "lucide-react";
import type { SkillRef } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-xs tracking-widest text-muted-foreground uppercase font-normal">2. AI Requirements Parser</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative border border-input focus-within:ring-1 focus-within:ring-ring rounded-md overflow-hidden bg-background shadow-sm transition-colors">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setParsed(false); }}
            placeholder="Paste your job description here… wait for the AI to parse the requirements."
            rows={8}
            className="flex w-full resize-none bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <div className="absolute bottom-2 right-2 text-[10px] font-mono text-muted-foreground bg-background px-1 rounded-sm">
            {text.length} chars
          </div>
        </div>

        <Button
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="w-full flex items-center justify-center gap-2"
        >
          {loading ? <LoadingSpinner /> : <Sparkles size={16} />}
          {loading ? "Parsing requirements…" : "Extract Skills with Gemini"}
        </Button>

        {error && (
          <p className="text-sm text-destructive border border-destructive/20 bg-destructive/10 p-3 rounded-md">
            {error}
          </p>
        )}

        {parsed && skills.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md bg-muted/20">
            No skills detected. Try a more detailed job description.
          </p>
        )}

        {skills.length > 0 && (
          <div className="p-4 rounded-md border border-input bg-muted/10">
            <p className="text-sm font-medium text-foreground mb-4">
              {skills.length} skills extracted <span className="text-muted-foreground font-normal ml-1">(Click × to modify)</span>
            </p>
            <SkillChipList skills={skills} removable onRemove={handleRemove} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
