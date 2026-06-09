export const STATUSES = ["Planning", "In Progress", "Blocked", "Testing", "Done"] as const;
export const PRIORITIES = ["Low", "Medium", "High"] as const;

export const STATUS_COLORS: Record<string, string> = {
  Planning: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "In Progress": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Blocked: "bg-red-500/20 text-red-400 border-red-500/30",
  Testing: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Done: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "text-zinc-400",
  Medium: "text-amber-400",
  High: "text-red-400",
};

export const PRIORITY_ICONS: Record<string, string> = {
  Low: "↓",
  Medium: "→",
  High: "↑",
};

export type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  dueDate: string | null;
  tags: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  tasks: Task[];
  activities?: ActivityLog[];
};

export type Task = {
  id: string;
  text: string;
  completed: boolean;
  order: number;
  projectId: string;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  projectId: string;
  action: string;
  createdAt: string;
};
