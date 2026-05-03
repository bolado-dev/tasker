export type Priority = "low" | "med" | "high"

export type Task = {
  id: string
  title: string
  notes?: string
  done: boolean
  priority: Priority
  projectId?: string
  dueDate?: string
  createdAt: number
  completedAt?: number
}

export type ProjectStatus = "active" | "paused" | "done"

export type Project = {
  id: string
  name: string
  description?: string
  color: string
  status: ProjectStatus
  createdAt: number
}

export type HabitType = "quit" | "build"

export type Habit = {
  id: string
  name: string
  description?: string
  type: HabitType
  startDate: string
  bestStreak: number
  totalRelapses: number
  createdAt: number
}

export type RoutineBlock = {
  id: string
  label: string
  startTime: string
  endTime: string
  activity: string
  emoji?: string
}

export type View = "overview" | "today" | "tasks" | "projects" | "habits"

export const PROJECT_COLORS = [
  { name: "emerald", className: "bg-emerald-500" },
  { name: "sky", className: "bg-sky-500" },
  { name: "violet", className: "bg-violet-500" },
  { name: "amber", className: "bg-amber-500" },
  { name: "rose", className: "bg-rose-500" },
  { name: "fuchsia", className: "bg-fuchsia-500" },
  { name: "teal", className: "bg-teal-500" },
  { name: "orange", className: "bg-orange-500" },
] as const

export function colorClass(name: string) {
  return PROJECT_COLORS.find((c) => c.name === name)?.className ?? "bg-emerald-500"
}
