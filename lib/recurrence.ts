import type { Event, Repeat, Task } from "./types"

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function withinUntil(targetISO: string, untilISO?: string) {
  if (!untilISO) return true
  return targetISO <= untilISO
}

export function occursOn(
  base: { date?: string; repeat?: Repeat; repeatUntil?: string },
  targetISO: string,
): boolean {
  if (!base.date) return false
  if (targetISO < base.date) return false
  if (!withinUntil(targetISO, base.repeatUntil)) return false
  const repeat = base.repeat ?? "none"
  if (repeat === "none") return base.date === targetISO
  if (repeat === "daily") return true
  if (repeat === "weekly") {
    const a = isoToDate(base.date).getDay()
    const b = isoToDate(targetISO).getDay()
    return a === b
  }
  return false
}

export type TaskInstance = Task & {
  instanceDate: string
  isInstance: boolean
}

export function expandTasksForDate(
  tasks: Task[],
  targetISO: string,
): TaskInstance[] {
  const out: TaskInstance[] = []
  for (const t of tasks) {
    const repeat = t.repeat ?? "none"
    if (repeat === "none") {
      if (t.dueDate === targetISO) {
        out.push({ ...t, instanceDate: targetISO, isInstance: false })
      }
      continue
    }
    if (
      !occursOn(
        { date: t.dueDate, repeat, repeatUntil: t.repeatUntil },
        targetISO,
      )
    ) {
      continue
    }
    const override = t.instances?.[targetISO]
    if (override?.skipped) continue
    out.push({
      ...t,
      done: override?.done ?? false,
      completedAt: override?.completedAt,
      instanceDate: targetISO,
      isInstance: true,
    })
  }
  return out
}

export function expandTasksInRange(
  tasks: Task[],
  fromISO: string,
  toISO: string,
): TaskInstance[] {
  const out: TaskInstance[] = []
  const current = isoToDate(fromISO)
  const end = isoToDate(toISO)
  while (current.getTime() <= end.getTime()) {
    const iso = dateToISO(current)
    out.push(...expandTasksForDate(tasks, iso))
    current.setDate(current.getDate() + 1)
  }
  return out
}

export type EventInstance = Event & {
  instanceDate: string
  isInstance: boolean
}

export function expandEventsForDate(
  events: Event[],
  targetISO: string,
): EventInstance[] {
  const out: EventInstance[] = []
  for (const e of events) {
    const repeat = e.repeat ?? "none"
    if (repeat === "none") {
      if (e.date === targetISO) {
        out.push({ ...e, instanceDate: targetISO, isInstance: false })
      }
      continue
    }
    if (
      !occursOn(
        { date: e.date, repeat, repeatUntil: e.repeatUntil },
        targetISO,
      )
    ) {
      continue
    }
    const override = e.instances?.[targetISO]
    if (override?.skipped) continue
    out.push({
      ...e,
      title: override?.title ?? e.title,
      notes: override?.notes ?? e.notes,
      startTime: override?.startTime ?? e.startTime,
      endTime: override?.endTime ?? e.endTime,
      instanceDate: targetISO,
      isInstance: true,
    })
  }
  return out
}

export function describeRepeat(repeat?: Repeat) {
  if (!repeat || repeat === "none") return "Sin repetir"
  if (repeat === "daily") return "Cada día"
  if (repeat === "weekly") return "Cada semana"
  return ""
}

export function setTaskInstanceDone(
  task: Task,
  dateISO: string,
  done: boolean,
): Task {
  const repeat = task.repeat ?? "none"
  if (repeat === "none") {
    return {
      ...task,
      done,
      completedAt: done ? Date.now() : undefined,
    }
  }
  const instances = { ...(task.instances ?? {}) }
  const prev = instances[dateISO] ?? {}
  instances[dateISO] = {
    ...prev,
    done,
    completedAt: done ? Date.now() : undefined,
    skipped: false,
  }
  return { ...task, instances }
}

export function skipEventInstance(event: Event, dateISO: string): Event {
  const repeat = event.repeat ?? "none"
  if (repeat === "none") return event
  const instances = { ...(event.instances ?? {}) }
  instances[dateISO] = { ...(instances[dateISO] ?? {}), skipped: true }
  return { ...event, instances }
}

export function skipTaskInstance(task: Task, dateISO: string): Task {
  const repeat = task.repeat ?? "none"
  if (repeat === "none") return task
  const instances = { ...(task.instances ?? {}) }
  instances[dateISO] = { ...(instances[dateISO] ?? {}), skipped: true }
  return { ...task, instances }
}
