"use client";

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Project } from "@/lib/constants";
import { parseTags } from "@/lib/helpers";
import { apiFetch } from "@/lib/fetch-utils";
import { useToast } from "@/components/Toast";
import SummaryStrip from "@/components/SummaryStrip";
import Filters from "@/components/Filters";
import RemindersPanel from "@/components/RemindersPanel";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectModal from "@/components/CreateProjectModal";

const PRIORITY_WEIGHT: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

export default function Dashboard() {
  return (
    <Suspense>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const { showToast } = useToast();

  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [sort, setSort] = useState("updated");
  const [showArchived, setShowArchived] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const url = showArchived ? "/api/projects?archived=true" : "/api/projects";
      const data = await apiFetch<Project[]>(url);
      setProjects(data);
    } catch (err) {
      showToast((err as Error).message);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [showToast, showArchived]);

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
    <div className="min-h-full bg-white text-black">
      <div className="max-w-[800px] mx-auto px-8 pt-10 pb-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-[13px] uppercase tracking-[1.5px] text-[#aaaaaa] mb-1">
              {showArchived ? "archived" : "dashboard"}
            </p>
            <p className="text-[15px] tracking-[-0.3px] text-[#888888]">
              {projects.length} project{projects.length !== 1 ? "s" : ""} {showArchived ? "archived" : "tracked"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowArchived(!showArchived); setLoading(true); }}
              className={`px-3 py-2.5 text-[13px] tracking-[-0.3px] rounded-md transition-all border ${
                showArchived
                  ? "bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100"
                  : "bg-[#fafafa] border-[#e0e0e0] text-[#888888] hover:text-black hover:border-[#999999]"
              }`}
            >
              {showArchived ? "Active" : "Archived"}
            </button>
            {!showArchived && (
              <button
                onClick={() => setModalOpen(true)}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 text-[13px] font-bold
                text-white rounded-md transition-all flex items-center gap-2 tracking-[-0.3px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                New Project
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="flex items-center gap-3 text-[#aaaaaa]">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
                <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className="text-[15px] tracking-[-0.3px]">Loading projects...</span>
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
                <div className="w-16 h-16 rounded-lg bg-[#fafafa] border border-[#f0f0f0] flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-[#aaaaaa]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                  </svg>
                </div>
                <p className="text-[15px] tracking-[-0.3px] text-[#888888] mb-1">
                  {projects.length === 0
                    ? "No projects yet"
                    : "No projects match filters"}
                </p>
                {projects.length === 0 && (
                  <button
                    onClick={() => setModalOpen(true)}
                    className="text-[13px] text-black underline underline-offset-2 hover:text-[#888888] transition-colors mt-1 tracking-[-0.3px]"
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
