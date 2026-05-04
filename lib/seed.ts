import type {
  Event,
  Habit,
  HealthGoal,
  Project,
  Recipe,
  RoutineBlock,
  SleepEntry,
  Task,
  WeightEntry,
} from "./types"

export function defaultProjects(): Project[] {
  return []
}

export function defaultTasks(): Task[] {
  return []
}

export function defaultHabits(): Habit[] {
  return []
}

export function defaultEvents(): Event[] {
  return []
}

export function defaultRoutine(): RoutineBlock[] {
  return []
}

export function defaultRecipes(): Recipe[] {
  return []
}

export function defaultSleep(): SleepEntry[] {
  return []
}

export function defaultWeight(): WeightEntry[] {
  return []
}

export function defaultHealthGoal(): HealthGoal {
  return {}
}
