"use client";

import { useState } from "react";
import { STATUSES, PRIORITIES } from "@/lib/constants";
import { apiFetch } from "@/lib/fetch-utils";
import { useToast } from "@/components/Toast";

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
  const { showToast } = useToast();

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch("/api/projects", {
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
      setName("");
      setDescription("");
      setStatus("Planning");
      setPriority("Medium");
      setDueDate("");
      setTags("");
      onCreated();
      onClose();
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full bg-[#fafafa] border border-[#e0e0e0] rounded-md px-3 py-2.5 text-[13px] tracking-[-0.3px] text-black focus:outline-none focus:border-[#999999] transition-colors placeholder-[#bbbbbb]";
  const labelClass = "block text-[11px] font-bold tracking-[-0.3px] text-[#888888] mb-1.5";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center modal-backdrop bg-white/60">
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-[#e0e0e0] rounded-2xl p-6 w-full max-w-lg mx-4 space-y-4 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-black tracking-[-0.5px] text-black">new project</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-lg hover:bg-[#fafafa] flex items-center justify-center text-[#aaaaaa] hover:text-black transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div>
          <label className={labelClass}>Name</label>
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Project name"
            autoFocus
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
            <label className={labelClass}>Tags</label>
            <input
              className={inputClass}
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma-separated"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[13px] text-[#888888] hover:text-black transition-colors rounded-lg hover:bg-[#fafafa]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name || saving}
            className="px-5 py-2 text-[13px] font-bold bg-black hover:bg-neutral-800 disabled:opacity-40
            text-white rounded-md transition-all tracking-[-0.3px]"
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
