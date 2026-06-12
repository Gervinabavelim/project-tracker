export const STATUSES = ["Planning", "In Progress", "Blocked", "Testing", "Done"] as const;
export const PRIORITIES = ["Low", "Medium", "High"] as const;

export const STATUS_COLORS: Record<string, string> = {
  Planning: "bg-blue-50 text-blue-600 border-blue-200",
  "In Progress": "bg-emerald-50 text-emerald-600 border-emerald-200",
  Blocked: "bg-red-50 text-red-600 border-red-200",
  Testing: "bg-purple-50 text-purple-600 border-purple-200",
  Done: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

export const PRIORITY_COLORS: Record<string, string> = {
  Low: "text-[#aaaaaa]",
  Medium: "text-[#888888]",
  High: "text-red-500",
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
  archived: boolean;
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
