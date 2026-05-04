export type Priority = "low" | "med" | "high"

export type Repeat = "none" | "daily" | "weekly"

export type Subtask = {
  id: string
  title: string
  done: boolean
}

export type TaskInstanceOverride = {
  done?: boolean
  skipped?: boolean
  completedAt?: number
}

export type Task = {
  id: string
  title: string
  notes?: string
  done: boolean
  priority: Priority
  projectId?: string
  dueDate?: string
  startTime?: string
  endTime?: string
  repeat?: Repeat
  repeatUntil?: string
  instances?: Record<string, TaskInstanceOverride>
  subtasks?: Subtask[]
  createdAt: number
  completedAt?: number
}

export function isTimedTask(t: { startTime?: string; endTime?: string }) {
  return Boolean(t.startTime && t.endTime)
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

export type EventInstanceOverride = {
  skipped?: boolean
  startTime?: string
  endTime?: string
  title?: string
  notes?: string
}

export type Event = {
  id: string
  title: string
  notes?: string
  date: string
  startTime: string
  endTime: string
  projectId?: string
  color?: string
  repeat?: Repeat
  repeatUntil?: string
  instances?: Record<string, EventInstanceOverride>
  createdAt: number
}

export type View =
  | "overview"
  | "today"
  | "tasks"
  | "projects"
  | "habits"
  | "recipes"
  | "health"

export type Recipe = {
  id: string
  title: string
  description?: string
  ingredients: string[]
  steps: string[]
  prepMin?: number
  cookMin?: number
  servings?: number
  tags: string[]
  imageUrl?: string
  favorite?: boolean
  createdAt: number
}

export type SleepEntry = {
  id: string
  date: string
  bedtime?: string
  wakeTime?: string
  hours: number
  quality: 1 | 2 | 3 | 4 | 5
  notes?: string
  createdAt: number
}

export type WeightEntry = {
  id: string
  date: string
  kg: number
  notes?: string
  createdAt: number
}

export type HealthGoal = {
  weightKg?: number
  sleepHours?: number
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
