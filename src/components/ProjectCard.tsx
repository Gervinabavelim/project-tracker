"use client";

import Link from "next/link";
import {
  Project,
  PRIORITY_COLORS,
  PRIORITY_ICONS,
} from "@/lib/constants";
import { daysUntilDue, formatDate } from "@/lib/helpers";

const STATUS_DOT: Record<string, string> = {
  Planning: "bg-blue-400",
  "In Progress": "bg-emerald-400",
  Blocked: "bg-red-400",
  Testing: "bg-purple-400",
  Done: "bg-zinc-500",
};

export default function ProjectCard({ project }: { project: Project }) {
  const days = daysUntilDue(project.dueDate);
  const isOverdue = days !== null && days < 0;
  const isDueSoon = days !== null && days >= 0 && days <= 7;
  const tasksLeft = project.tasks.filter((t) => !t.completed).length;
  const totalTasks = project.tasks.length;

  return (
    <Link href={`/project/${project.id}`}>
      <div
        className={`project-card bg-zinc-800/40 border rounded-2xl p-4 cursor-pointer group
        hover:bg-zinc-800/70 hover:shadow-lg hover:shadow-black/20 ${
          isOverdue
            ? "border-red-500/30 hover:border-red-500/50"
            : isDueSoon
              ? "border-amber-500/25 hover:border-amber-500/40"
              : "border-zinc-700/30 hover:border-zinc-600/50"
        }`}
      >
        {/* Top row: status dot + name */}
        <div className="flex items-start gap-2.5 mb-3">
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${STATUS_DOT[project.status] ?? "bg-zinc-500"}`}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-zinc-200 group-hover:text-white truncate leading-tight">
              {project.name}
            </h3>
            <span className="text-[11px] text-zinc-500 mt-0.5 block">
              {project.status}
            </span>
          </div>
        </div>

        {/* Priority & due */}
        <div className="flex items-center gap-3 text-[11px] mb-3">
          <span className={PRIORITY_COLORS[project.priority]}>
            {PRIORITY_ICONS[project.priority]} {project.priority}
          </span>
          {project.dueDate && (
            <span
              className={
                isOverdue
                  ? "text-red-400 font-medium"
                  : isDueSoon
                    ? "text-amber-400"
                    : "text-zinc-600"
              }
            >
              {isOverdue
                ? `${Math.abs(days!)}d overdue`
                : isDueSoon
                  ? `${days}d left`
                  : formatDate(project.dueDate)}
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="mb-2">
          <div className="flex justify-between text-[11px] text-zinc-600 mb-1.5">
            <span>Progress</span>
            <span className="font-mono">{project.progress}%</span>
          </div>
          <div className="h-1 bg-zinc-700/50 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                project.progress === 100
                  ? "bg-emerald-500"
                  : project.progress >= 60
                    ? "bg-blue-500"
                    : "bg-amber-500/80"
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Bottom row: tasks + tags */}
        <div className="flex items-center justify-between mt-3">
          {totalTasks > 0 ? (
            <span className="text-[11px] text-zinc-600">
              <span className="font-mono text-zinc-400">{tasksLeft}</span>/{totalTasks} tasks left
            </span>
          ) : (
            <span />
          )}

          {project.tags && (
            <div className="flex gap-1 justify-end">
              {project.tags
                .split(",")
                .slice(0, 2)
                .map((tag) => (
                  <span
                    key={tag.trim()}
                    className="text-[9px] px-1.5 py-0.5 rounded-md bg-zinc-700/30 text-zinc-500"
                  >
                    {tag.trim()}
                  </span>
                ))}
              {project.tags.split(",").length > 2 && (
                <span className="text-[9px] px-1 py-0.5 text-zinc-600">
                  +{project.tags.split(",").length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
