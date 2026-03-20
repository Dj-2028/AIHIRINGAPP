import { create } from "zustand";
import type { SkillRef, SkillEntry } from "@/types";

type GlassBoxTab = "breakdown" | "timeline" | "bias";

interface AppStore {
  // Job creation — parsed skills from JD
  parsedSkills: SkillRef[];
  setParsedSkills: (skills: SkillRef[]) => void;
  removeSkill: (skill_id: string) => void;

  // Leaderboard — expanded row
  expandedCandidateId: string | null;
  setExpandedCandidate: (id: string | null) => void;

  // Leaderboard — active glass-box tab
  activeGlassBoxTab: GlassBoxTab;
  setActiveGlassBoxTab: (tab: GlassBoxTab) => void;

  // Profile builder — local skill entries
  skillEntries: SkillEntry[];
  setSkillEntries: (entries: SkillEntry[]) => void;
  addSkillEntry: (entry: SkillEntry) => void;
  removeSkillEntry: (id: string) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  parsedSkills: [],
  setParsedSkills: (skills) => set({ parsedSkills: skills }),
  removeSkill: (skill_id) =>
    set((s) => ({ parsedSkills: s.parsedSkills.filter((sk) => sk.skill_id !== skill_id) })),

  expandedCandidateId: null,
  setExpandedCandidate: (id) => set({ expandedCandidateId: id }),

  activeGlassBoxTab: "breakdown",
  setActiveGlassBoxTab: (tab) => set({ activeGlassBoxTab: tab }),

  skillEntries: [],
  setSkillEntries: (entries) => set({ skillEntries: entries }),
  addSkillEntry: (entry) =>
    set((s) => ({ skillEntries: [...s.skillEntries, entry] })),
  removeSkillEntry: (id) =>
    set((s) => ({ skillEntries: s.skillEntries.filter((e) => e.id !== id) })),
}));
