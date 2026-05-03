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

export type View =
  | "overview"
  | "today"
  | "tasks"
  | "projects"
  | "habits"
  | "reminders"

export type ReminderRepeat = "once" | "daily" | "weekdays" | "weekly"

export type Reminder = {
  id: string
  title: string
  body?: string
  time: string
  date?: string
  weekday?: number
  repeat: ReminderRepeat
  enabled: boolean
  lastFiredAt?: number
  nextFireAt: number
  createdAt: number
}

export const PROJECT_COLORS = [
  { name: "lavender", className: "bg-violet-300/70 dark:bg-violet-400/40" },
  { name: "blush", className: "bg-pink-300/60 dark:bg-pink-400/30" },
  { name: "mint", className: "bg-emerald-300/60 dark:bg-emerald-400/30" },
  { name: "peach", className: "bg-orange-200/80 dark:bg-orange-300/30" },
  { name: "sky", className: "bg-sky-300/60 dark:bg-sky-400/30" },
  { name: "sand", className: "bg-amber-200/70 dark:bg-amber-300/25" },
] as const

export function colorClass(name: string) {
  return (
    PROJECT_COLORS.find((c) => c.name === name)?.className ??
    "bg-violet-300/70 dark:bg-violet-400/40"
  )
}
