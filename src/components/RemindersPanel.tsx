"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Project } from "@/lib/constants";
import { daysUntilDue } from "@/lib/helpers";

export default function RemindersPanel({ projects }: { projects: Project[] }) {
  const reminders = projects
    .map((p) => ({ ...p, days: daysUntilDue(p.dueDate) }))
    .filter((p) => p.days !== null && p.days <= 7 && p.status !== "Done")
    .sort((a, b) => (a.days ?? 999) - (b.days ?? 999));

  useEffect(() => {
    const dueToday = reminders.filter((r) => r.days === 0);
    if (dueToday.length === 0) return;

    if (Notification.permission === "default") {
      Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
      dueToday.forEach((p) => {
        new Notification("Project Due Today", {
          body: p.name,
          icon: "/favicon.ico",
        });
      });
    }
  }, [reminders]);

  if (reminders.length === 0) return null;

  return (
    <div className="mb-5 bg-[#fafafa] border border-[#f0f0f0] rounded-lg p-3.5">
      <h2 className="text-[11px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-2.5 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        Reminders
      </h2>
      <div className="space-y-1.5">
        {reminders.map((p) => {
          const isOverdue = p.days !== null && p.days < 0;
          return (
            <Link
              key={p.id}
              href={`/project/${p.id}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] tracking-[-0.3px] transition-colors border ${
                isOverdue
                  ? "bg-red-50 border-red-200 text-red-500 hover:bg-red-100"
                  : "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
              }`}
            >
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 text-[11px] font-mono ml-2 opacity-70">
                {isOverdue
                  ? `${Math.abs(p.days!)}d overdue`
                  : p.days === 0
                    ? "Today"
                    : `${p.days}d`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
