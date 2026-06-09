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

  // Editable fields
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Loading...
      </div>
    );
  }

  if (!project) return null;

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500";
  const labelClass = "block text-xs text-zinc-500 mb-1 font-medium";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
          >
            &larr; Dashboard
          </button>
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-xs text-zinc-500 animate-pulse">Saving...</span>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-1.5 text-sm bg-red-600/20 hover:bg-red-600/40 text-red-400
              border border-red-600/30 rounded-lg transition-colors"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {/* Main form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: fields */}
          <div className="lg:col-span-2 space-y-4">
            <div>
              <label className={labelClass}>Project Name</label>
              <input
                className={`${inputClass} text-lg font-semibold`}
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
                    onClick={() => setProgress(suggested)}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Auto-calc: {suggested}%
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
                <span className="text-sm font-mono text-zinc-400 w-10 text-right">
                  {progress}%
                </span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all ${
                    progress === 100
                      ? "bg-emerald-500"
                      : progress >= 60
                        ? "bg-blue-500"
                        : "bg-amber-500"
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
                    className="flex items-center gap-2 bg-zinc-900/60 border border-zinc-800 rounded-lg px-3 py-2 group"
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      className="accent-emerald-500 shrink-0"
                    />
                    <span
                      className={`flex-1 text-sm ${
                        task.completed ? "line-through text-zinc-600" : "text-zinc-300"
                      }`}
                    >
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all text-xs"
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
                  onClick={addTask}
                  disabled={!newTask.trim()}
                  className="px-3 py-2 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700
                  text-zinc-300 rounded-lg transition-colors disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Notes (Markdown)</label>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showPreview ? "Edit" : "Preview"}
                </button>
              </div>
              {showPreview ? (
                <div className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 min-h-[120px] prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {notes || "*No notes yet*"}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  className={`${inputClass} h-32 resize-y font-mono text-xs`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Write markdown notes here..."
                />
              )}
            </div>
          </div>

          {/* Right sidebar: metadata + activity */}
          <div className="space-y-4">
            {/* Status card */}
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 space-y-3">
              <div>
                <div className="text-xs text-zinc-500">Status</div>
                <span
                  className={`inline-block text-xs px-2 py-0.5 rounded-full border mt-1 ${STATUS_COLORS[project.status]}`}
                >
                  {project.status}
                </span>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Priority</div>
                <span className={`text-sm ${PRIORITY_COLORS[project.priority]}`}>
                  {PRIORITY_ICONS[project.priority]} {project.priority}
                </span>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Due Date</div>
                <div className="text-sm text-zinc-300">{formatDate(project.dueDate)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Created</div>
                <div className="text-sm text-zinc-300">{formatDate(project.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-zinc-500">Last Updated</div>
                <div className="text-sm text-zinc-300">{formatDate(project.updatedAt)}</div>
              </div>
            </div>

            {/* Activity log */}
            <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-3">Activity Log</h3>
              {project.activities && project.activities.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {project.activities.map((a) => (
                    <div
                      key={a.id}
                      className="border-l-2 border-zinc-700 pl-3 py-1"
                    >
                      <div className="text-xs text-zinc-300">{a.action}</div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">
                        {formatDateTime(a.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-zinc-600">No activity yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
