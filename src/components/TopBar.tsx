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

export default function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const currentProjectId = pathname.startsWith("/project/")
    ? pathname.split("/")[2]
    : null;
  const currentProject = projects.find((p) => p.id === currentProjectId);

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

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
    if (!open) setSearch("");
  }, [open]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 300);
  };

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
      <div
        className="relative pointer-events-auto"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Toggle Pill */}
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-full cursor-default select-none transition-all duration-300 topbar-pill ${
            open
              ? "bg-white border border-[#d0d0d0] shadow-lg"
              : "bg-[#fafafa] border border-[#e0e0e0] shadow-sm hover:border-[#999999] hover:shadow-md"
          }`}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />

          <div className="flex items-center gap-2">
            {currentProject && (
              <div
                className={`w-2 h-2 rounded-full ${STATUS_DOT[currentProject.status] ?? "bg-neutral-400"}`}
              />
            )}
            <span className="text-[13px] font-bold tracking-[-0.3px] text-black max-w-[200px] truncate">
              {currentProject ? currentProject.name : "all projects"}
            </span>
          </div>

          <svg
            className={`w-3 h-3 text-[#aaaaaa] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown */}
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[320px] rounded-2xl overflow-hidden transition-all duration-200 origin-top topbar-dropdown ${
            open
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-[0.97] -translate-y-1 pointer-events-none"
          }`}
        >
          <div className="bg-white border border-[#e0e0e0] rounded-2xl shadow-lg">
            {/* Search */}
            <div className="p-2.5">
              <div className="relative">
                <svg
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#bbbbbb]"
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
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#fafafa] border border-[#e0e0e0] rounded-xl pl-8 pr-3 py-2 text-[13px] tracking-[-0.3px] text-black placeholder-[#bbbbbb] focus:outline-none focus:border-[#999999] transition-colors"
                />
              </div>
            </div>

            {/* Dashboard link */}
            <div className="px-1.5">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                  !currentProjectId
                    ? "bg-[#fafafa] text-black"
                    : "text-[#888888] hover:bg-[#fafafa] hover:text-black"
                }`}
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <span className="text-[13px] font-bold tracking-[-0.3px]">Dashboard</span>
                {!currentProjectId && (
                  <svg className="w-3.5 h-3.5 ml-auto text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </Link>
            </div>

            {/* Divider */}
            <div className="mx-3 my-1.5 h-px bg-[#f0f0f0]" />

            {/* Label */}
            <div className="px-4 py-1">
              <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa]">
                Projects
              </span>
            </div>

            {/* Project list */}
            <div className="max-h-[280px] overflow-y-auto px-1.5 pb-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-8 text-center text-[13px] text-[#aaaaaa]">
                  {projects.length === 0
                    ? "No projects yet"
                    : "No matches found"}
                </div>
              ) : (
                filtered.map((p) => {
                  const isActive = p.id === currentProjectId;
                  const dot = STATUS_DOT[p.status] ?? "bg-neutral-400";
                  const tasksLeft = p.tasks?.filter((t) => !t.completed).length ?? 0;
                  const totalTasks = p.tasks?.length ?? 0;

                  return (
                    <Link
                      key={p.id}
                      href={`/project/${p.id}`}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group ${
                        isActive
                          ? "bg-[#fafafa]"
                          : "hover:bg-[#fafafa]"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`text-[13px] font-bold tracking-[-0.3px] truncate ${
                            isActive ? "text-black" : "text-[#888888] group-hover:text-black"
                          }`}
                        >
                          {p.name}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="h-1 w-16 bg-[#f0f0f0] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.progress === 100
                                  ? "bg-emerald-400"
                                  : p.progress >= 60
                                    ? "bg-[#3b82f6]"
                                    : "bg-amber-400"
                              }`}
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#aaaaaa] font-mono">
                            {p.progress}%
                          </span>
                          {totalTasks > 0 && (
                            <span className="text-[10px] text-[#aaaaaa]">
                              {tasksLeft}/{totalTasks}
                            </span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <svg
                          className="w-3.5 h-3.5 shrink-0 text-black"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </Link>
                  );
                })
              )}
            </div>

            {/* New Project */}
            <div className="border-t border-[#f0f0f0] p-1.5">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/?new=1");
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-[13px] text-[#888888] hover:text-black hover:bg-[#fafafa] rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Project
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
