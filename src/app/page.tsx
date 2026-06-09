"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Project } from "@/lib/constants";
import { parseTags } from "@/lib/helpers";
import SummaryStrip from "@/components/SummaryStrip";
import Filters from "@/components/Filters";
import RemindersPanel from "@/components/RemindersPanel";
import ProjectCard from "@/components/ProjectCard";
import CreateProjectModal from "@/components/CreateProjectModal";

const PRIORITY_WEIGHT: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Filters
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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Project Tracker</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Local-first &bull; No cloud &bull; You own everything
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-sm font-medium
            text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <span className="text-lg leading-none">+</span> New Project
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-zinc-500">Loading projects...</div>
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
              <div className="text-center py-20 text-zinc-600">
                {projects.length === 0
                  ? "No projects yet. Create your first one!"
                  : "No projects match the current filters."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
