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
    <div className="mb-5 bg-zinc-800/30 border border-zinc-700/25 rounded-xl p-3.5">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2.5 flex items-center gap-2">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Reminders
      </h2>
      <div className="space-y-1.5">
        {reminders.map((p) => {
          const isOverdue = p.days !== null && p.days < 0;
          return (
            <Link
              key={p.id}
              href={`/project/${p.id}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-[13px] transition-colors ${
                isOverdue
                  ? "bg-red-500/8 border border-red-500/20 text-red-400 hover:bg-red-500/15"
                  : "bg-amber-500/8 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15"
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
