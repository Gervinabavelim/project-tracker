"use client";

import Link from "next/link";
import {
  Project,
  STATUS_COLORS,
  PRIORITY_COLORS,
  PRIORITY_ICONS,
} from "@/lib/constants";
import { daysUntilDue, formatDate } from "@/lib/helpers";

export default function ProjectCard({ project }: { project: Project }) {
  const days = daysUntilDue(project.dueDate);
  const isOverdue = days !== null && days < 0;
  const isDueSoon = days !== null && days >= 0 && days <= 7;
  const tasksLeft = project.tasks.filter((t) => !t.completed).length;
  const totalTasks = project.tasks.length;

  let borderClass = "border-zinc-700/50";
  if (isOverdue) borderClass = "border-red-500/60";
  else if (isDueSoon) borderClass = "border-amber-500/50";

  return (
    <Link href={`/project/${project.id}`}>
      <div
        className={`bg-zinc-800/60 border ${borderClass} rounded-xl p-4 hover:bg-zinc-800
        hover:border-zinc-600 transition-all cursor-pointer group`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-zinc-100 group-hover:text-white truncate">
            {project.name}
          </h3>
          <span
            className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status]}`}
          >
            {project.status}
          </span>
        </div>

        {/* Priority & due date */}
        <div className="flex items-center gap-3 text-xs mb-3">
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
                    : "text-zinc-500"
              }
            >
              {isOverdue
                ? `Overdue by ${Math.abs(days!)}d`
                : isDueSoon
                  ? `Due in ${days}d`
                  : formatDate(project.dueDate)}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>Progress</span>
            <span className="font-mono">{project.progress}%</span>
          </div>
          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                project.progress === 100
                  ? "bg-emerald-500"
                  : project.progress >= 60
                    ? "bg-blue-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Tasks remaining */}
        {totalTasks > 0 && (
          <div className="text-xs text-zinc-500">
            <span className="font-mono text-zinc-400">{tasksLeft}</span> of{" "}
            {totalTasks} tasks remaining
          </div>
        )}

        {/* Tags */}
        {project.tags && (
          <div className="flex flex-wrap gap-1 mt-2">
            {project.tags.split(",").map((tag) => (
              <span
                key={tag.trim()}
                className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/50 text-zinc-400"
              >
                {tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
