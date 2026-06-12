"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import { formatDate, formatDateTime } from "@/lib/helpers";
import { apiFetch } from "@/lib/fetch-utils";
import { useToast } from "@/components/Toast";

type TeamMember = {
  id: string;
  userId: string;
  user: { id: string; name: string; email: string };
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [togglingTasks, setTogglingTasks] = useState<Set<string>>(new Set());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
  const [directory, setDirectory] = useState("");

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
      setDirectory(data.directory || "");
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

  useEffect(() => {
    fetch("/api/team")
      .then((r) => r.json())
      .then((data) => setTeamMembers(data?.members ?? []))
      .catch(() => {});
  }, []);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      await fetchProject();
      showToast("Saved", "success");
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    save({ name, description, status, priority, dueDate: dueDate || null, tags, notes });
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    setAddingTask(true);
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
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    setTogglingTasks((prev) => new Set(prev).add(taskId));
    try {
      await apiFetch(`/api/projects/${id}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !completed }),
      });
      await fetchProject();
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setTogglingTasks((prev) => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
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
    if (!confirm("Delete this project permanently? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/projects/${id}`, { method: "DELETE" });
      router.push("/");
    } catch (err) {
      showToast((err as Error).message);
      setDeleting(false);
    }
  };

  const handleArchive = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archived: !project?.archived }),
      });
      if (!project?.archived) {
        showToast("Project archived", "success");
        router.push("/");
      } else {
        await fetchProject();
        showToast("Project restored", "success");
      }
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-white flex items-center justify-center">
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
    <div className="min-h-full bg-white text-black">
      <div className="max-w-[800px] mx-auto px-8 pt-10 pb-6 animate-fade-in">
        {/* Archived banner */}
        {project.archived && (
          <div className="mb-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
            <span className="text-[13px] tracking-[-0.3px] text-amber-600">This project is archived</span>
            <button
              type="button"
              onClick={handleArchive}
              className="text-[12px] font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              Restore
            </button>
          </div>
        )}

        {/* Top actions bar */}
        <div className="flex items-center justify-end mb-6">
          <div className="flex items-center gap-2">
            {saving && (
              <span className="text-[11px] text-[#aaaaaa] animate-pulse">Saving...</span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 text-[13px] font-bold bg-black hover:bg-neutral-800 disabled:opacity-40 text-white rounded-md transition-all tracking-[-0.3px]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleArchive}
              disabled={saving}
              className="px-3 py-1.5 text-[13px] tracking-[-0.3px] text-[#888888] hover:text-amber-600 hover:bg-amber-50
              border border-transparent hover:border-amber-200 rounded-md transition-all disabled:opacity-40"
            >
              {project.archived ? "Restore" : "Archive"}
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

            {/* Linked Folder */}
            <div>
              <label className={labelClass}>Linked Folder</label>
              <div className="flex items-center gap-2">
                {directory ? (
                  <>
                    <div className="flex-1 flex items-center gap-2 bg-[#fafafa] border border-[#e0e0e0] rounded-md px-3 py-2.5">
                      <svg className="w-4 h-4 text-[#888888] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                      </svg>
                      <span className="text-[13px] tracking-[-0.3px] text-[#888888] truncate">{directory}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 shrink-0">
                        auto-tracking
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setDirectory(""); save({ directory: "" }); }}
                      className="text-[11px] text-[#aaaaaa] hover:text-red-400 transition-colors"
                    >
                      unlink
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      const api = (window as unknown as { electronAPI?: { pickDirectory: () => Promise<string | null> } }).electronAPI;
                      if (!api?.pickDirectory) {
                        showToast("Folder linking requires the desktop app");
                        return;
                      }
                      const dir = await api.pickDirectory();
                      if (dir) {
                        setDirectory(dir);
                        save({ directory: dir });
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 bg-[#fafafa] border border-dashed border-[#d0d0d0] rounded-md
                    hover:border-[#999999] hover:bg-[#f5f5f5] transition-all text-[13px] tracking-[-0.3px] text-[#888888] hover:text-black"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                    </svg>
                    Link a folder to auto-track
                  </button>
                )}
              </div>
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

            {/* Progress (auto-synced from tasks) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className={labelClass}>Progress</label>
                <span className="text-[11px] text-[#aaaaaa]">
                  auto-tracked from tasks
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      progress === 100
                        ? "bg-emerald-400"
                        : progress >= 60
                          ? "bg-[#3b82f6]"
                          : "bg-amber-400"
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-[13px] font-mono text-[#888888] w-10 text-right">
                  {progress}%
                </span>
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
                    className={`flex items-center gap-2.5 bg-[#fafafa] border border-[#f0f0f0] rounded-lg px-3 py-2.5 group ${
                      togglingTasks.has(task.id) ? "opacity-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id, task.completed)}
                      disabled={togglingTasks.has(task.id)}
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
                  disabled={addingTask}
                />
                <button
                  type="button"
                  onClick={addTask}
                  disabled={!newTask.trim() || addingTask}
                  className="px-3 py-2 text-[13px] bg-[#fafafa] hover:bg-[#f0f0f0] border border-[#e0e0e0]
                  text-[#888888] hover:text-black rounded-md transition-all disabled:opacity-40 tracking-[-0.3px]"
                >
                  {addingTask ? "..." : "Add"}
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
              {directory && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-1">Tracking</div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[12px] tracking-[-0.3px] text-emerald-600">Live</span>
                  </div>
                </div>
              )}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#aaaaaa] mb-1">Assigned To</div>
                <select
                  className="w-full bg-white border border-[#e0e0e0] rounded-md px-2 py-1.5 text-[12px] text-black focus:outline-none focus:border-[#999] transition-colors"
                  value={project.assigneeId ?? ""}
                  onChange={(e) => save({ assigneeId: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}{m.user.id === (session?.user as { id?: string })?.id ? " (you)" : ""}
                    </option>
                  ))}
                </select>
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
                      <div className="flex items-start gap-2">
                        {a.user ? (
                          <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[8px] font-bold shrink-0 mt-0.5">
                            {a.user.name[0].toUpperCase()}
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-[#e0e0e0] flex items-center justify-center shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-[#999]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] tracking-[-0.3px] text-[#888888]">
                            {a.user && <span className="font-semibold text-[#666]">{a.user.name} </span>}
                            {a.action}
                          </div>
                          <div className="text-[10px] text-[#aaaaaa] mt-0.5">
                            {formatDateTime(a.createdAt)}
                          </div>
                        </div>
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
