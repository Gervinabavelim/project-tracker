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

  // Browser notifications for items due today
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
    <div className="mb-6 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4">
      <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        Reminders
      </h2>
      <div className="space-y-2">
        {reminders.map((p) => {
          const isOverdue = p.days !== null && p.days < 0;
          return (
            <Link
              key={p.id}
              href={`/project/${p.id}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                isOverdue
                  ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                  : "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              <span className="truncate">{p.name}</span>
              <span className="shrink-0 text-xs font-mono ml-2">
                {isOverdue
                  ? `${Math.abs(p.days!)}d overdue`
                  : p.days === 0
                    ? "Due today"
                    : `${p.days}d left`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
