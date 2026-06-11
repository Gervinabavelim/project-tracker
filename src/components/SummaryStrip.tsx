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
    { label: "Total", value: total, color: "text-black", dot: "bg-[#888888]" },
    { label: "In Progress", value: inProgress, color: "text-emerald-500", dot: "bg-emerald-400" },
    { label: "Blocked", value: blocked, color: "text-red-500", dot: "bg-red-400" },
    { label: "Due Soon", value: dueSoon, color: "text-amber-500", dot: "bg-amber-400" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="stat-card bg-[#fafafa] border border-[#f0f0f0] rounded-lg px-4 py-3.5"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
            <span className="text-[11px] tracking-[-0.3px] text-[#aaaaaa]">{s.label}</span>
          </div>
          <div className={`text-xl font-black font-mono tracking-[-1px] ${s.color}`}>
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}
