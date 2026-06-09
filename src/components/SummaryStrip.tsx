"use client";

import { Project } from "@/lib/constants";
import { daysUntilDue } from "@/lib/helpers";

export default function SummaryStrip({ projects }: { projects: Project[] }) {
  const total = projects.length;
  const inProgress = projects.filter((p) => p.status === "In Progress").length;
  const blocked = projects.filter((p) => p.status === "Blocked").length;
  const dueSoon = projects.filter((p) => {
    const d = daysUntilDue(p.dueDate);
    return d !== null && d >= 0 && d <= 7;
  }).length;

  const stats = [
    { label: "Total", value: total, color: "text-zinc-100" },
    { label: "In Progress", value: inProgress, color: "text-emerald-400" },
    { label: "Blocked", value: blocked, color: "text-red-400" },
    { label: "Due ≤ 7 days", value: dueSoon, color: "text-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-center"
        >
          <div className={`text-2xl font-bold font-mono ${s.color}`}>
            {s.value}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
