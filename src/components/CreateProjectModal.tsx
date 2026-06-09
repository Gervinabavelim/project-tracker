"use client";

import { useState } from "react";
import { STATUSES, PRIORITIES } from "@/lib/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateProjectModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Planning");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        status,
        priority,
        dueDate: dueDate || null,
        tags,
      }),
    });
    setSaving(false);
    setName("");
    setDescription("");
    setStatus("Planning");
    setPriority("Medium");
    setDueDate("");
    setTags("");
    onCreated();
    onClose();
  };

  const inputClass =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-zinc-500";
  const labelClass = "block text-xs text-zinc-400 mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4"
      >
        <h2 className="text-lg font-semibold text-zinc-100">New Project</h2>

        <div>
          <label className={labelClass}>Name *</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Project name"
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            className={`${inputClass} h-20 resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="grid grid-cols-2 gap-3">
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
            <label className={labelClass}>Tags (comma-separated)</label>
            <input
              className={inputClass}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. client work, TKFS"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name || saving}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-50
            text-white rounded-lg transition-colors"
          >
            {saving ? "Creating…" : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
