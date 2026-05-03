"use client"

import * as React from "react"
import type {
  Event,
  Habit,
  Project,
  Reminder,
  RoutineBlock,
  Task,
} from "./types"
import {
  defaultEvents,
  defaultHabits,
  defaultProjects,
  defaultReminders,
  defaultRoutine,
  defaultTasks,
} from "./seed"

const KEYS = {
  tasks: "tasker.tasks.v1",
  projects: "tasker.projects.v1",
  habits: "tasker.habits.v1",
  routine: "tasker.routine.v1",
  reminders: "tasker.reminders.v1",
  events: "tasker.events.v1",
  seeded: "tasker.seeded.v1",
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
    if (!window.localStorage.getItem(KEYS.reminders))
      write(KEYS.reminders, defaultReminders())
    if (!window.localStorage.getItem(KEYS.events))
      write(KEYS.events, defaultEvents())
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
  reminders?: Reminder[]
  events?: Event[]
}) {
  setStored(KEYS.tasks, snap.tasks, EMPTY_TASKS_REF)
  setStored(KEYS.projects, snap.projects, EMPTY_PROJECTS_REF)
  setStored(KEYS.habits, snap.habits, EMPTY_HABITS_REF)
  setStored(KEYS.routine, snap.routine, EMPTY_ROUTINE_REF)
  setStored(KEYS.reminders, snap.reminders ?? [], EMPTY_REMINDERS_REF)
  setStored(KEYS.events, snap.events ?? [], EMPTY_EVENTS_REF)
}

const EMPTY_TASKS_REF: Task[] = []
const EMPTY_PROJECTS_REF: Project[] = []
const EMPTY_HABITS_REF: Habit[] = []
const EMPTY_ROUTINE_REF: RoutineBlock[] = []
const EMPTY_REMINDERS_REF: Reminder[] = []
const EMPTY_EVENTS_REF: Event[] = []

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
const EMPTY_REMINDERS: Reminder[] = []
const EMPTY_EVENTS: Event[] = []

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
  const [reminders, setReminders] = useStored<Reminder[]>(
    KEYS.reminders,
    EMPTY_REMINDERS,
  )
  const [events, setEvents] = useStored<Event[]>(KEYS.events, EMPTY_EVENTS)

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
    reminders,
    setReminders,
    events,
    setEvents,
  }
}

export const STORAGE_KEYS = KEYS
