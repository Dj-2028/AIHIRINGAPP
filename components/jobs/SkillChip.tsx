"use client";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SkillChipProps {
  name: string;
  removable?: boolean;
  onRemove?: () => void;
  type?: "required" | "nice-to-have";
}

export function SkillChip({ name, removable, onRemove, type = "required" }: SkillChipProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 border border-[#E5E5E3] bg-white text-[13px] font-mono text-[#6B7280] transition-colors",
      removable && "hover:border-[#1A1A18] hover:text-[#1A1A18]",
      type === "nice-to-have" && "border-dashed"
    )}>
      {name}
      {removable && (
        <button onClick={onRemove} className="hover:text-red-500 transition-colors">
          <X size={12} />
        </button>
      )}
    </span>
  );
}
