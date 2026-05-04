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
  events: Event[]
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>
  recipes: Recipe[]
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>
  sleep: SleepEntry[]
  setSleep: React.Dispatch<React.SetStateAction<SleepEntry[]>>
  weight: WeightEntry[]
  setWeight: React.Dispatch<React.SetStateAction<WeightEntry[]>>
  healthGoal: HealthGoal
  setHealthGoal: React.Dispatch<React.SetStateAction<HealthGoal>>
}
