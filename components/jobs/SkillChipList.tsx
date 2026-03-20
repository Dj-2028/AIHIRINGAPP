"use client";
import { SkillChip } from "./SkillChip";
import type { SkillRef } from "@/types";

interface SkillChipListProps {
  skills: SkillRef[];
  onRemove?: (skill_id: string) => void;
  removable?: boolean;
}

export function SkillChipList({ skills, onRemove, removable = false }: SkillChipListProps) {
  if (!skills || skills.length === 0) return null;

  const required = skills.filter((s) => s.weight >= 1);
  const nice = skills.filter((s) => s.weight < 1);

  return (
    <div className="space-y-4">
      {required.length > 0 && (
        <div>
          <p className="text-[11px] font-mono text-[#6B7280] mb-2 uppercase">Required ({required.length})</p>
          <div className="flex flex-wrap gap-2">
            {required.map((s) => (
              <SkillChip
                key={s.skill_id}
                name={s.skill_name}
                type="required"
                removable={removable}
                onRemove={() => onRemove?.(s.skill_id)}
              />
            ))}
          </div>
        </div>
      )}
      {nice.length > 0 && (
        <div>
          <p className="text-[11px] font-mono text-[#6B7280] mb-2 uppercase">Nice to have ({nice.length})</p>
          <div className="flex flex-wrap gap-2">
            {nice.map((s) => (
              <SkillChip
                key={s.skill_id}
                name={s.skill_name}
                type="nice-to-have"
                removable={removable}
                onRemove={() => onRemove?.(s.skill_id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
