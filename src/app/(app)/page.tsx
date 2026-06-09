"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Project } from "@/lib/constants";
import { parseTags } from "@/lib/helpers";
import SummaryStrip from "@/components/SummaryStrip";
import Filters from "@/components/Filters";
import RemindersPanel from "@/components/RemindersPanel";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectModal from "@/components/CreateProjectModal";

const PRIORITY_WEIGHT: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

export default function Dashboard() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [sort, setSort] = useState("updated");

  const fetchProjects = useCallback(async () => {
    const res = await fetch("/api/projects");
    const data = await res.json();
    setProjects(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setModalOpen(true);
      window.history.replaceState({}, "", "/");
    }
  }, [searchParams]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => parseTags(p.tags).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [projects]);

  const filtered = useMemo(() => {
    let result = [...projects];
    if (filterStatus) result = result.filter((p) => p.status === filterStatus);
    if (filterPriority) result = result.filter((p) => p.priority === filterPriority);
    if (filterTag) result = result.filter((p) => parseTags(p.tags).includes(filterTag));

    if (sort === "due") {
      result.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sort === "priority") {
      result.sort(
        (a, b) => (PRIORITY_WEIGHT[b.priority] ?? 0) - (PRIORITY_WEIGHT[a.priority] ?? 0)
      );
    }

    return result;
  }, [projects, filterStatus, filterPriority, filterTag, sort]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setFilterStatus(value);
    if (key === "priority") setFilterPriority(value);
    if (key === "tag") setFilterTag(value);
    if (key === "sort") setSort(value);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-6xl mx-auto px-6 py-6 animate-fade-in">
        {/* Subtle header — main nav is in the TopBar */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-600 mb-1">
              Dashboard
            </p>
            <p className="text-sm text-zinc-500">
              {projects.length} project{projects.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 text-[13px] font-medium
            text-zinc-300 hover:text-zinc-100 rounded-xl border border-zinc-700/50 hover:border-zinc-600/50
            transition-all flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Project
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex items-center gap-3 text-zinc-600">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-sm">Loading projects...</span>
            </div>
          </div>
        ) : (
          <>
            <SummaryStrip projects={projects} />
            <RemindersPanel projects={projects} />
            <Filters
              status={filterStatus}
              priority={filterPriority}
              tag={filterTag}
              sort={sort}
              allTags={allTags}
              onChange={handleFilterChange}
            />

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/30 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
                <p className="text-sm text-zinc-500 mb-1">
                  {projects.length === 0
                    ? "No projects yet"
                    : "No projects match filters"}
                </p>
                {projects.length === 0 && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors mt-1"
                  >
                    Create your first project
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 stagger-children">
                {filtered.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <CreateProjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchProjects}
      />
    </div>
  );
}
