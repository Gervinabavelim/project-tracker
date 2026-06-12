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
  Done: "bg-neutral-400",
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
        className={`project-card bg-[#fafafa] border rounded-lg p-4 cursor-pointer group
        hover:border-[#999999] ${
          isOverdue
            ? "border-red-200"
            : isDueSoon
              ? "border-amber-200"
              : "border-[#f0f0f0]"
        }`}
      >
        {/* Top row: status dot + name */}
        <div className="flex items-start gap-2.5 mb-3">
          <div
            className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${STATUS_DOT[project.status] ?? "bg-neutral-400"}`}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-bold tracking-[-0.3px] text-black group-hover:text-black truncate leading-tight">
              {project.name}
            </h3>
            <span className="text-[11px] text-[#aaaaaa] mt-0.5 block">
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
                  ? "text-red-500 font-bold"
                  : isDueSoon
                    ? "text-amber-500"
                    : "text-[#aaaaaa]"
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
          <div className="flex justify-between text-[11px] text-[#aaaaaa] mb-1.5">
            <span>Progress</span>
            <span className="font-mono">{project.progress}%</span>
          </div>
          <div className="h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                project.progress === 100
                  ? "bg-emerald-400"
                  : project.progress >= 60
                    ? "bg-[#3b82f6]"
                    : "bg-amber-400"
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Bottom row: assignee + tasks + tags */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2">
            {project.assignee && (
              <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[8px] font-bold shrink-0" title={project.assignee.name}>
                {project.assignee.name[0].toUpperCase()}
              </div>
            )}
            {totalTasks > 0 ? (
              <span className="text-[11px] text-[#aaaaaa]">
                <span className="font-mono text-[#888888]">{tasksLeft}</span>/{totalTasks} tasks left
              </span>
            ) : (
              <span />
            )}
          </div>

          {project.tags && (
            <div className="flex gap-1 justify-end">
              {project.tags
                .split(",")
                .slice(0, 2)
                .map((tag) => (
                  <span
                    key={tag.trim()}
                    className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#f0f0f0] text-[#888888] border border-[#f0f0f0]"
                  >
                    {tag.trim()}
                  </span>
                ))}
              {project.tags.split(",").length > 2 && (
                <span className="text-[9px] px-1 py-0.5 text-[#aaaaaa]">
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
