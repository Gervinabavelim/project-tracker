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
import { apiFetch } from "@/lib/fetch-utils";
import { useToast } from "@/components/Toast";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

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
    try {
      const data = await apiFetch<Project>(`/api/projects/${id}`);
      setProject(data);
      setName(data.name);
      setDescription(data.description);
      setStatus(data.status);
      setPriority(data.priority);
      setProgress(data.progress);
      setDueDate(data.dueDate ? data.dueDate.split("T")[0] : "");
      setTags(data.tags);
      setNotes(data.notes);
    } catch (err) {
      const message = (err as Error).message;
      if (message === "Not found" || message === "Project not found") {
        router.push("/");
      } else {
        showToast(message);
      }
    } finally {
      setLoading(false);
    }
  }, [id, router, showToast]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await fetchProject();
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    save({ name, description, status, priority, progress, dueDate: dueDate || null, tags, notes });
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    try {
      await apiFetch(`/api/projects/${id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newTask }),
      });
      setNewTask("");
      await fetchProject();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      await apiFetch(`/api/projects/${id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      await fetchProject();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await apiFetch(`/api/projects/${id}/tasks/${taskId}`, { method: "DELETE" });
      await fetchProject();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      showToast((err as Error).message);
      setDeleting(false);
    }
  };

  const suggested = project ? suggestedProgress(project.tasks) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#aaaaaa]">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
            <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="text-[15px] tracking-[-0.3px]">Loading...</span>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const inputClass =
    "w-full bg-[#fafafa] border border-[#e0e0e0] rounded-md px-3 py-2.5 text-[13px] tracking-[-0.3px] text-black focus:outline-none focus:border-[#999999] transition-colors placeholder-[#bbbbbb]";
  const labelClass = "block text-[11px] font-bold tracking-[-0.3px] text-[#888888] mb-1.5";

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-[800px] mx-auto px-6 py-6 animate-fade-in">
        {/* Top actions bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-[12px] tracking-[-0.3px] text-[#888888] hover:text-black transition-colors flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-lg hover:bg-[#fafafa]"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-[11px] text-[#aaaaaa] animate-pulse">Saving...</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-[13px] font-bold bg-black hover:bg-neutral-800 text-white rounded-md transition-all tracking-[-0.3px]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-[13px] tracking-[-0.3px] text-red-400 hover:text-red-500 hover:bg-red-50
              border border-transparent hover:border-red-200 rounded-md transition-all"
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
                className={`${inputClass} text-[15px] font-bold`}
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
                    className="text-[11px] text-[#888888] hover:text-black transition-colors underline underline-offset-2"
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
                  className="flex-1"
                />
                <span className="text-[13px] font-mono text-[#888888] w-10 text-right">
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress === 100
                      ? "bg-emerald-400"
                      : progress >= 60
                        ? "bg-[#3b82f6]"
                        : "bg-amber-400"
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
                    className="flex items-center gap-2.5 bg-[#fafafa] border border-[#f0f0f0] rounded-lg px-3 py-2.5 group"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      className="accent-black shrink-0 w-3.5 h-3.5"
                    />
                    <span
                      className={`flex-1 text-[13px] tracking-[-0.3px] ${
                        task.completed ? "line-through text-[#bbbbbb]" : "text-black"
                      }`}
                    >
                      {task.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      className="text-[#bbbbbb] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-[11px]"
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
                  className="px-3 py-2 text-[13px] bg-[#fafafa] hover:bg-[#f0f0f0] border border-[#e0e0e0]
                  text-[#888888] hover:text-black rounded-md transition-all disabled:opacity-40 tracking-[-0.3px]"
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
                  className="text-[11px] text-[#aaaaaa] hover:text-black transition-colors underline underline-offset-2"
                >
                  {showPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {showPreview ? (
                <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-lg px-4 py-3 min-h-[120px] prose prose-sm max-w-none">
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
            <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-lg p-4 space-y-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-1">Status</div>
                <span
                  className={`inline-block text-[11px] px-2 py-0.5 rounded-full border ${STATUS_COLORS[project.status]}`}
                >
                  {project.status}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-1">Priority</div>
                <span className={`text-[13px] tracking-[-0.3px] ${PRIORITY_COLORS[project.priority]}`}>
                  {PRIORITY_ICONS[project.priority]} {project.priority}
                </span>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-1">Due</div>
                <div className="text-[13px] tracking-[-0.3px] text-black">{formatDate(project.dueDate)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-1">Created</div>
                <div className="text-[13px] tracking-[-0.3px] text-[#888888]">{formatDate(project.createdAt)}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-1">Updated</div>
                <div className="text-[13px] tracking-[-0.3px] text-[#888888]">{formatDate(project.updatedAt)}</div>
              </div>
            </div>

            {/* Activity log */}
            <div className="bg-[#fafafa] border border-[#f0f0f0] rounded-lg p-4">
              <h3 className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-3">
                Activity
              </h3>
              {project.activities && project.activities.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {project.activities.map((a) => (
                    <div
                      key={a.id}
                      className="border-l-2 border-[#e0e0e0] pl-3 py-1"
                    >
                      <div className="text-[12px] tracking-[-0.3px] text-[#888888]">{a.action}</div>
                      <div className="text-[10px] text-[#aaaaaa] mt-0.5">
                        {formatDateTime(a.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[12px] tracking-[-0.3px] text-[#aaaaaa]">No activity yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
