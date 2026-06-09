"use client";

import { useState, useEffect, useCallback } from "react";
import { Project } from "@/lib/constants";

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      openDashboard: () => void;
      openProject: (id: string) => void;
      openNewProject: () => void;
    };
  }
}

const STATUS_DOT: Record<string, string> = {
  Planning: "bg-blue-400",
  "In Progress": "bg-emerald-400",
  Blocked: "bg-red-400",
  Testing: "bg-purple-400",
  Done: "bg-zinc-500",
};

export default function TrayPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data);
    } catch {}
  }, []);

  useEffect(() => {
    document.body.style.background = "transparent";
    document.documentElement.style.background = "transparent";
    return () => {
      document.body.style.background = "";
      document.documentElement.style.background = "";
    };
  }, []);

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 15000);
    return () => clearInterval(interval);
  }, [fetchProjects]);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDashboard = () => {
    if (window.electronAPI) {
      window.electronAPI.openDashboard();
    } else {
      window.location.href = "/";
    }
  };

  const handleOpenProject = (id: string) => {
    if (window.electronAPI) {
      window.electronAPI.openProject(id);
    } else {
      window.location.href = `/project/${id}`;
    }
  };

  const handleNewProject = () => {
    if (window.electronAPI) {
      window.electronAPI.openNewProject();
    } else {
      window.location.href = "/?new=1";
    }
  };

  return (
    <div className="h-screen flex flex-col select-none bg-transparent">
      {/* Toggle Pill Header */}
      <div className="flex justify-center pt-3 pb-2 px-4 drag-region">
        <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-800/90 border border-zinc-700/40 shadow-sm">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.9" />
              <rect x="9" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
              <rect x="1" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.6" />
              <rect x="9" y="9" width="6" height="6" rx="1.5" fill="white" opacity="0.4" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-zinc-200">All Projects</span>
          <svg
            className="w-3 h-3 text-zinc-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden px-3 pb-2">
        {/* Search */}
        <div className="mb-2">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500"
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
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700/30 rounded-xl pl-8 pr-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600/50 transition-colors"
            />
          </div>
        </div>

        {/* Dashboard link */}
        <button
          type="button"
          onClick={handleOpenDashboard}
          className="flex items-center gap-3 px-3 py-2 rounded-xl bg-blue-500/10 text-blue-400 mb-1 w-full text-left"
        >
          <svg
            className="w-4 h-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
          <span className="text-[13px] font-medium">Dashboard</span>
          <svg
            className="w-3.5 h-3.5 ml-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </button>

        {/* Divider + label */}
        <div className="px-1 pt-2 pb-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
            Projects
          </span>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-zinc-600">
              {projects.length === 0 ? "No projects yet" : "No matches"}
            </div>
          ) : (
            filtered.map((p) => {
              const dot = STATUS_DOT[p.status] ?? "bg-zinc-500";
              const tasksLeft = p.tasks?.filter((t) => !t.completed).length ?? 0;
              const totalTasks = p.tasks?.length ?? 0;

              return (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleOpenProject(p.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors w-full text-left"
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-zinc-200 truncate">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 w-16 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.progress === 100
                              ? "bg-emerald-500"
                              : p.progress >= 60
                                ? "bg-blue-500"
                                : "bg-amber-500/80"
                          }`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-600 font-mono">
                        {p.progress}%
                      </span>
                      {totalTasks > 0 && (
                        <span className="text-[10px] text-zinc-600">
                          {tasksLeft}/{totalTasks}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* New Project */}
        <div className="border-t border-zinc-800/50 pt-1.5 mt-1">
          <button
            type="button"
            onClick={handleNewProject}
            className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 rounded-xl transition-colors w-full"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </button>
        </div>
      </div>
    </div>
  );
}
