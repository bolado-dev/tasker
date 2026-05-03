import type { Habit, Project, Reminder, RoutineBlock, Task } from "./types"

export type Store = {
  hydrated: boolean
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  projects: Project[]
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>
  habits: Habit[]
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>
  routine: RoutineBlock[]
  setRoutine: React.Dispatch<React.SetStateAction<RoutineBlock[]>>
  reminders: Reminder[]
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
}
