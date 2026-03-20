"use client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import type { SkillEntry } from "@/types";
import { format } from "date-fns";

interface LearningTimelineChartProps { entries: SkillEntry[] }

export function LearningTimelineChart({ entries }: LearningTimelineChartProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[13px] text-[#6B7280]">
        No skill history yet
      </div>
    );
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.learned_from).getTime() - new Date(b.learned_from).getTime()
  );

  const data = sorted.map((e, i) => ({
    name: format(new Date(e.learned_from), "MMM yy"),
    skills: i + 1,
    skill: e.skill_name,
    days: e.days_to_learn,
  }));

  return (
    <div>
      <p className="text-[13px] text-[#6B7280] mb-4">
        Cumulative skills acquired over time — hover points for details
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -10, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E3" />
          <XAxis dataKey="name" tick={{ fill: "#6B7280", fontSize: 13, fontFamily: 'var(--font-mono)' }} />
          <YAxis tick={{ fill: "#6B7280", fontSize: 13, fontFamily: 'var(--font-mono)' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#FAFAF9", border: "1px solid #E5E5E3", borderRadius: 0, color: "#1A1A18", fontSize: "13px", fontFamily: "var(--font-mono)" }}
            formatter={(value) => [`${value} skills`, "Progress"]}
          />
          <Line
            type="monotone" dataKey="skills" stroke="#1A1A18" strokeWidth={2}
            dot={{ fill: "#1A1A18", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#D97706" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
