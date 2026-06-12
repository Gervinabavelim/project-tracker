"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Project } from "@/lib/constants";

const STATUS_DOT: Record<string, string> = {
  Planning: "bg-blue-400",
  "In Progress": "bg-emerald-400",
  Blocked: "bg-red-400",
  Testing: "bg-purple-400",
  Done: "bg-neutral-400",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const currentProjectId = pathname.startsWith("/project/")
    ? pathname.split("/")[2]
    : null;

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchProjects();
  }, [pathname, fetchProjects]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <aside className="w-[240px] h-screen flex flex-col border-r border-[#e8e8e8] bg-[#f6f6f6]/80 backdrop-blur-xl select-none shrink-0">
      {/* Drag region — macOS title bar area */}
      <div className="h-[52px] shrink-0 drag-region" />

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <svg
            className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#999999]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/[0.04] rounded-md pl-7 pr-2 py-[5px] text-[12px] text-black placeholder-[#999999] focus:outline-none focus:bg-black/[0.06] transition-colors"
          />
        </div>
      </div>

      {/* Dashboard link */}
      <div className="px-2">
        <Link
          href="/"
          className={`flex items-center gap-2.5 px-2 py-[6px] rounded-md transition-colors ${
            !currentProjectId
              ? "bg-black/[0.06] text-black"
              : "text-[#666666] hover:bg-black/[0.04] hover:text-black"
          }`}
        >
          <svg className="w-4 h-4 shrink-0 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
          </svg>
          <span className="text-[12px] font-semibold">All Projects</span>
        </Link>
      </div>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-[1px] text-[#999999]">
          Projects
        </span>
      </div>

      {/* Project list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <div className="px-2 py-6 text-center text-[11px] text-[#aaaaaa]">
            {projects.length === 0 ? "No projects yet" : "No matches"}
          </div>
        ) : (
          <div className="space-y-px">
            {filtered.map((p) => {
              const isActive = p.id === currentProjectId;
              const dot = STATUS_DOT[p.status] ?? "bg-neutral-400";
              const tasksLeft = p.tasks?.filter((t) => !t.completed).length ?? 0;
              const totalTasks = p.tasks?.length ?? 0;

              return (
                <Link
                  key={p.id}
                  href={`/project/${p.id}`}
                  className={`flex items-center gap-2.5 px-2 py-[6px] rounded-md transition-colors group ${
                    isActive
                      ? "bg-black/[0.06] text-black"
                      : "text-[#666666] hover:bg-black/[0.04] hover:text-black"
                  }`}
                >
                  <div className={`w-[6px] h-[6px] rounded-full shrink-0 ${dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold truncate">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="h-[3px] w-12 bg-black/[0.06] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            p.progress === 100
                              ? "bg-emerald-400"
                              : p.progress >= 60
                                ? "bg-blue-400"
                                : "bg-amber-400"
                          }`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#aaaaaa] font-mono tabular-nums">
                        {p.progress}%
                      </span>
                      {totalTasks > 0 && (
                        <span className="text-[9px] text-[#aaaaaa]">
                          {tasksLeft}/{totalTasks}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* New Project */}
      <div className="border-t border-black/[0.06] p-2">
        <button
          onClick={() => router.push("/?new=1")}
          className="flex items-center gap-2 w-full px-2 py-[6px] text-[12px] text-[#888888] hover:text-black hover:bg-black/[0.04] rounded-md transition-colors"
        >
          <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Project
        </button>
      </div>
    </aside>
  );
}
