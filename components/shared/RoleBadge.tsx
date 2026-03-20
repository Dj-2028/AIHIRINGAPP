"use client";

interface RoleBadgeProps { role: "recruiter" | "candidate" | "admin" }

const configs = {
  recruiter: { label: "Recruiter", bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
  candidate: { label: "Candidate", bg: "rgba(251,191,36,0.15)",  color: "#fbbf24" },
  admin:     { label: "Admin",     bg: "rgba(74,222,128,0.15)",  color: "#4ade80" },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  return (
    <span className="text-[11px] font-mono px-1.5 py-0.5 border border-[#1A1A18] text-[#1A1A18] uppercase bg-[#FAFAF9]">
      {role}
    </span>
  );
}
