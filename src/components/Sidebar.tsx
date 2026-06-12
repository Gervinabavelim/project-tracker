"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("");
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
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => {
        const me = data?.members?.find(
          (m: { user: { id: string } }) => m.user.id === (session?.user as { id?: string })?.id
        );
        if (me) setUserRole(me.role);
      })
      .catch(() => {});
  }, [fetchProjects, session]);

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

      {/* User menu */}
      {session?.user && (
        <div className="border-t border-black/[0.06] p-2 relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 w-full px-2 py-[6px] text-[12px] text-[#666666] hover:text-black hover:bg-black/[0.04] rounded-md transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold shrink-0">
              {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-[12px] font-semibold truncate">{session.user.name}</div>
              <div className="text-[10px] text-[#aaaaaa] truncate">{session.user.email}</div>
            </div>
            <svg className="w-3 h-3 opacity-40 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
            </svg>
          </button>
          {userMenuOpen && (
            <div className="absolute bottom-full left-2 right-2 mb-1 bg-white border border-[#e0e0e0] rounded-lg shadow-lg py-1 z-50">
              <Link
                href="/team"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#666] hover:bg-[#f5f5f5] transition-colors"
              >
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                Team
              </Link>
              {userRole === "admin" && (
                <Link
                  href="/audit"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#666] hover:bg-[#f5f5f5] transition-colors"
                >
                  <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  Audit Log
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex items-center gap-2 w-full px-3 py-2 text-[12px] text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
