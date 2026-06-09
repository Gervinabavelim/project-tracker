"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Project,
  STATUSES,
  PRIORITIES,
  STATUS_COLORS,
  PRIORITY_COLORS,
  PRIORITY_ICONS,
} from "@/lib/constants";
import { formatDate, formatDateTime, suggestedProgress } from "@/lib/helpers";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [progress, setProgress] = useState(0);
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [newTask, setNewTask] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProject = useCallback(async () => {
    const res = await fetch(`/api/projects/${id}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setProject(data);
    setName(data.name);
    setDescription(data.description);
    setStatus(data.status);
    setPriority(data.priority);
    setProgress(data.progress);
    setDueDate(data.dueDate ? data.dueDate.split("T")[0] : "");
    setTags(data.tags);
    setNotes(data.notes);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await fetchProject();
    setSaving(false);
  };

  const handleSave = () => {
    save({ name, description, status, priority, progress, dueDate: dueDate || null, tags, notes });
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    await fetch(`/api/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newTask }),
    });
    setNewTask("");
    await fetchProject();
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    await fetch(`/api/projects/${id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !completed }),
    });
    await fetchProject();
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/projects/${id}/tasks/${taskId}`, { method: "DELETE" });
    await fetchProject();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    router.push("/");
  };

  const suggested = project ? suggestedProgress(project.tasks) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-600">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const inputClass =
    "w-full bg-zinc-900/60 border border-zinc-700/30 rounded-xl px-3 py-2.5 text-[13px] text-zinc-200 focus:outline-none focus:border-zinc-600/50 transition-colors placeholder-zinc-600";
  const labelClass = "block text-[11px] font-medium text-zinc-500 mb-1.5";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-6 animate-fade-in">
        {/* Top actions bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[12px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg hover:bg-zinc-800/50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-[11px] text-zinc-600 animate-pulse">Saving...</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-[13px] font-medium bg-blue-600/90 hover:bg-blue-500 text-white rounded-xl transition-all shadow-sm"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-[13px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10
              border border-transparent hover:border-red-500/20 rounded-xl transition-all"
            >
              {deleting ? "..." : "Delete"}
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: form */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className={labelClass}>Project Name</label>
              <input
                className={`${inputClass} text-[15px] font-semibold`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className={labelClass}>Description</label>
              <textarea
                className={`${inputClass} h-20 resize-none`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <select
                  className={inputClass}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Due Date</label>
                <input
                  type="date"
                  className={inputClass}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Tags</label>
                <input
                  className={inputClass}
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="comma-separated"
                />
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Progress</label>
                {project.tasks.length > 0 && suggested !== progress && (
                  <button
                    type="button"
                    onClick={() => setProgress(suggested)}
                    className="text-[11px] text-blue-400/80 hover:text-blue-300 transition-colors"
                  >
                    Auto: {suggested}%
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span className="text-[13px] font-mono text-zinc-500 w-10 text-right">
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800/80 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress === 100
                      ? "bg-emerald-500"
                      : progress >= 60
                        ? "bg-blue-500"
                        : "bg-amber-500/80"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Tasks */}
            <div>
              <label className={labelClass}>
                Tasks ({project.tasks.filter((t) => !t.completed).length} remaining)
              </label>
              <div className="space-y-1 mb-2">
                {project.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-2.5 bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-3 py-2.5 group"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      className="accent-emerald-500 shrink-0 w-3.5 h-3.5"
                    />
                    <span
                      className={`flex-1 text-[13px] ${
                        task.completed ? "line-through text-zinc-600" : "text-zinc-300"
                      }`}
                    >
                      {task.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-[11px]"
                    >
                      remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Add a task..."
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                />
                <button
                  type="button"
                  onClick={addTask}
                  disabled={!newTask.trim()}
                  className="px-3 py-2 text-[13px] bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30
                  text-zinc-400 hover:text-zinc-200 rounded-xl transition-all disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Notes</label>
                <button
                  type="button"
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {showPreview ? (
                <div className="bg-zinc-900/40 border border-zinc-800/40 rounded-xl px-4 py-3 min-h-[120px] prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {notes || "*No notes yet*"}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className={`${inputClass} h-32 resize-y font-mono text-[12px]`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Markdown notes..."
                />
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-3">
            {/* Status card */}
            <div className="bg-zinc-800/30 border border-zinc-700/25 rounded-2xl p-4 space-y-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Status</div>
                <span
                  className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status]}`}
                >
                  {project.status}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Priority</div>
                <span className={`text-[13px] ${PRIORITY_COLORS[project.priority]}`}>
                  {PRIORITY_ICONS[project.priority]} {project.priority}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Due</div>
                <div className="text-[13px] text-zinc-300">{formatDate(project.dueDate)}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Created</div>
                <div className="text-[13px] text-zinc-400">{formatDate(project.createdAt)}</div>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">Updated</div>
                <div className="text-[13px] text-zinc-400">{formatDate(project.updatedAt)}</div>
              </div>
            </div>

            {/* Activity log */}
            <div className="bg-zinc-800/30 border border-zinc-700/25 rounded-2xl p-4">
              <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600 mb-3">
                Activity
              </h3>
              {project.activities && project.activities.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {project.activities.map((a) => (
                    <div
                      key={a.id}
                      className="border-l border-zinc-700/50 pl-3 py-1"
                    >
                      <div className="text-[12px] text-zinc-400">{a.action}</div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">
                        {formatDateTime(a.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] text-zinc-600">No activity yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
