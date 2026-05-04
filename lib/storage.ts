"use client"

import * as React from "react"
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
import {
  defaultEvents,
  defaultHabits,
  defaultProjects,
  defaultRoutine,
  defaultTasks,
  defaultRecipes,
  defaultSleep,
  defaultWeight,
  defaultHealthGoal,
} from "./seed"

const KEYS = {
  tasks: "tasker.tasks.v1",
  projects: "tasker.projects.v1",
  habits: "tasker.habits.v1",
  routine: "tasker.routine.v1",
  events: "tasker.events.v1",
  recipes: "tasker.recipes.v1",
  sleep: "tasker.sleep.v1",
  weight: "tasker.weight.v1",
  healthGoal: "tasker.healthGoal.v1",
  seeded: "tasker.seeded.v2",
} as const

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota errors
  }
}

let seeded = false
function ensureSeeded() {
  if (seeded || typeof window === "undefined") return
  if (window.localStorage.getItem(KEYS.seeded) !== "1") {
    if (!window.localStorage.getItem(KEYS.tasks)) write(KEYS.tasks, defaultTasks())
    if (!window.localStorage.getItem(KEYS.projects))
      write(KEYS.projects, defaultProjects())
    if (!window.localStorage.getItem(KEYS.habits)) write(KEYS.habits, defaultHabits())
    if (!window.localStorage.getItem(KEYS.routine)) write(KEYS.routine, defaultRoutine())
    if (!window.localStorage.getItem(KEYS.events))
      write(KEYS.events, defaultEvents())
    if (!window.localStorage.getItem(KEYS.recipes))
      write(KEYS.recipes, defaultRecipes())
    if (!window.localStorage.getItem(KEYS.sleep)) write(KEYS.sleep, defaultSleep())
    if (!window.localStorage.getItem(KEYS.weight)) write(KEYS.weight, defaultWeight())
    if (!window.localStorage.getItem(KEYS.healthGoal))
      write(KEYS.healthGoal, defaultHealthGoal())
    window.localStorage.setItem(KEYS.seeded, "1")
  }
  seeded = true
}

const cache = new Map<string, unknown>()
const listeners = new Set<() => void>()

function getSnapshot<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T
  ensureSeeded()
  const v = read(key, fallback)
  cache.set(key, v)
  return v
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

function notify() {
  listeners.forEach((l) => l())
}

function setStored<T>(key: string, updater: T | ((prev: T) => T), fallback: T) {
  const prev = getSnapshot(key, fallback)
  const next =
    typeof updater === "function"
      ? (updater as (p: T) => T)(prev)
      : updater
  cache.set(key, next)
  write(key, next)
  notify()
}

function useStored<T>(key: string, fallback: T) {
  const fallbackRef = React.useRef(fallback)
  const value = React.useSyncExternalStore(
    subscribe,
    () => getSnapshot(key, fallbackRef.current),
    () => fallbackRef.current,
  )
  const setValue = React.useCallback(
    (updater: T | ((prev: T) => T)) => setStored(key, updater, fallbackRef.current),
    [key],
  )
  return [value, setValue] as const
}

export function replaceSnapshot(snap: {
  tasks: Task[]
  projects: Project[]
  habits: Habit[]
  routine: RoutineBlock[]
  events?: Event[]
  recipes?: Recipe[]
  sleep?: SleepEntry[]
  weight?: WeightEntry[]
  healthGoal?: HealthGoal
}) {
  setStored(KEYS.tasks, snap.tasks, EMPTY_TASKS_REF)
  setStored(KEYS.projects, snap.projects, EMPTY_PROJECTS_REF)
  setStored(KEYS.habits, snap.habits, EMPTY_HABITS_REF)
  setStored(KEYS.routine, snap.routine, EMPTY_ROUTINE_REF)
  setStored(KEYS.events, snap.events ?? [], EMPTY_EVENTS_REF)
  setStored(KEYS.recipes, snap.recipes ?? [], EMPTY_RECIPES_REF)
  setStored(KEYS.sleep, snap.sleep ?? [], EMPTY_SLEEP_REF)
  setStored(KEYS.weight, snap.weight ?? [], EMPTY_WEIGHT_REF)
  setStored(KEYS.healthGoal, snap.healthGoal ?? {}, EMPTY_GOAL_REF)
}

const EMPTY_TASKS_REF: Task[] = []
const EMPTY_PROJECTS_REF: Project[] = []
const EMPTY_HABITS_REF: Habit[] = []
const EMPTY_ROUTINE_REF: RoutineBlock[] = []
const EMPTY_EVENTS_REF: Event[] = []
const EMPTY_RECIPES_REF: Recipe[] = []
const EMPTY_SLEEP_REF: SleepEntry[] = []
const EMPTY_WEIGHT_REF: WeightEntry[] = []
const EMPTY_GOAL_REF: HealthGoal = {}

export function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const EMPTY_TASKS: Task[] = []
const EMPTY_PROJECTS: Project[] = []
const EMPTY_HABITS: Habit[] = []
const EMPTY_ROUTINE: RoutineBlock[] = []
const EMPTY_EVENTS: Event[] = []
const EMPTY_RECIPES: Recipe[] = []
const EMPTY_SLEEP: SleepEntry[] = []
const EMPTY_WEIGHT: WeightEntry[] = []
const EMPTY_GOAL: HealthGoal = {}

const noopSubscribe = () => () => {}

export function useIsClient() {
  return React.useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  )
}

export function useTasker() {
  const [tasks, setTasks] = useStored<Task[]>(KEYS.tasks, EMPTY_TASKS)
  const [projects, setProjects] = useStored<Project[]>(KEYS.projects, EMPTY_PROJECTS)
  const [habits, setHabits] = useStored<Habit[]>(KEYS.habits, EMPTY_HABITS)
  const [routine, setRoutine] = useStored<RoutineBlock[]>(KEYS.routine, EMPTY_ROUTINE)
  const [events, setEvents] = useStored<Event[]>(KEYS.events, EMPTY_EVENTS)
  const [recipes, setRecipes] = useStored<Recipe[]>(KEYS.recipes, EMPTY_RECIPES)
  const [sleep, setSleep] = useStored<SleepEntry[]>(KEYS.sleep, EMPTY_SLEEP)
  const [weight, setWeight] = useStored<WeightEntry[]>(KEYS.weight, EMPTY_WEIGHT)
  const [healthGoal, setHealthGoal] = useStored<HealthGoal>(
    KEYS.healthGoal,
    EMPTY_GOAL,
  )

  const hydrated = useIsClient()

  return {
    hydrated,
    tasks,
    setTasks,
    projects,
    setProjects,
    habits,
    setHabits,
    routine,
    setRoutine,
    events,
    setEvents,
    recipes,
    setRecipes,
    sleep,
    setSleep,
    weight,
    setWeight,
    healthGoal,
    setHealthGoal,
  }
}

export const STORAGE_KEYS = KEYS
