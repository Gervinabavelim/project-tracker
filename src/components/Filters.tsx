"use client";

import { STATUSES, PRIORITIES } from "@/lib/constants";

type FiltersProps = {
  status: string;
  priority: string;
  tag: string;
  sort: string;
  allTags: string[];
  onChange: (key: string, value: string) => void;
};

export default function Filters({
  status,
  priority,
  tag,
  sort,
  allTags,
  onChange,
}: FiltersProps) {
  const selectClass =
    "bg-zinc-800/50 border border-zinc-700/30 text-zinc-400 text-[12px] rounded-lg px-3 py-1.5 focus:outline-none focus:border-zinc-600/50 hover:border-zinc-600/40 hover:text-zinc-300 transition-all cursor-pointer appearance-none";

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <select
        className={selectClass}
        value={status}
        onChange={(e) => onChange("status", e.target.value)}
      >
        <option value="">All Status</option>
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={priority}
        onChange={(e) => onChange("priority", e.target.value)}
      >
        <option value="">All Priority</option>
        {PRIORITIES.map((p) => (
          <option key={p}>{p}</option>
        ))}
      </select>

      <select
        className={selectClass}
        value={tag}
        onChange={(e) => onChange("tag", e.target.value)}
      >
        <option value="">All Tags</option>
        {allTags.map((t) => (
          <option key={t}>{t}</option>
        ))}
      </select>

      <div className="ml-auto">
        <select
          className={selectClass}
          value={sort}
          onChange={(e) => onChange("sort", e.target.value)}
        >
          <option value="updated">Last Updated</option>
          <option value="due">Due Date</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </div>
  );
}
