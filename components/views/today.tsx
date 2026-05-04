"use client"

import * as React from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  TimelineGrid,
  type TimelineItem,
  type TimelineTaskItem,
} from "@/components/timeline-grid"
import { EventDialog, type EventDefaults } from "@/components/dialogs/event-dialog"
import { TaskDialog, type TaskDefaults } from "@/components/dialogs/task-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { colorClass, isTimedTask, type Event, type Task } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { formatDayHeading, shiftISO, todayISO } from "@/lib/format"
import {
  expandEventsForDate,
  expandTasksForDate,
  setTaskInstanceDone,
  skipEventInstance,
  type EventInstance,
  type TaskInstance,
} from "@/lib/recurrence"

type CreatePrefill = { startTime: string; endTime: string } | null

export function TodayView({ store }: { store: Store }) {
  const [date, setDate] = React.useState<string>(todayISO())
  // Event dialog
  const [eventOpen, setEventOpen] = React.useState(false)
  const [editingEvent, setEditingEvent] = React.useState<Event | null>(null)
  const [editingEventInstance, setEditingEventInstance] = React.useState<
    string | null
  >(null)
  const [eventDefaults, setEventDefaults] = React.useState<EventDefaults | null>(null)
  // Task dialog
  const [taskOpen, setTaskOpen] = React.useState(false)
  const [editingTask, setEditingTask] = React.useState<Task | null>(null)
  const [taskDefaults, setTaskDefaults] = React.useState<TaskDefaults | null>(null)
  // Choose-type dialog (when creating from drag)
  const [chooseOpen, setChooseOpen] = React.useState(false)
  const [chooseRange, setChooseRange] = React.useState<CreatePrefill>(null)

  const dayEvents = React.useMemo<EventInstance[]>(
    () => expandEventsForDate(store.events, date),
    [store.events, date],
  )
  const dayTasks = React.useMemo<TaskInstance[]>(
    () => expandTasksForDate(store.tasks, date),
    [store.tasks, date],
  )
  const allDayTasks = dayTasks.filter((t) => !isTimedTask(t))
  const timedTasks = dayTasks.filter((t) => isTimedTask(t))

  const timelineItems = React.useMemo<TimelineItem[]>(() => {
    const eventItems: TimelineItem[] = dayEvents.map((e) => ({
      kind: "event",
      id: e.id,
      instanceDate: e.instanceDate,
      title: e.title,
      notes: e.notes,
      startTime: e.startTime,
      endTime: e.endTime,
      projectId: e.projectId,
      color: e.color,
    }))
    const taskItems: TimelineItem[] = timedTasks.map((t) => ({
      kind: "task",
      id: t.id,
      instanceDate: t.instanceDate,
      title: t.title,
      notes: t.notes,
      startTime: t.startTime!,
      endTime: t.endTime!,
      projectId: t.projectId,
      done: t.done,
    }))
    return [...eventItems, ...taskItems]
  }, [dayEvents, timedTasks])

  function openCreateEvent(prefill?: { startTime: string; endTime: string }) {
    setEditingEvent(null)
    setEditingEventInstance(null)
    setEventDefaults({
      date,
      startTime: prefill?.startTime ?? "09:00",
      endTime: prefill?.endTime ?? "10:00",
    })
    setEventOpen(true)
  }

  function openCreateTask(prefill?: { startTime: string; endTime: string }) {
    setEditingTask(null)
    setTaskDefaults({
      dueDate: date,
      startTime: prefill?.startTime,
      endTime: prefill?.endTime,
    })
    setTaskOpen(true)
  }

  function openEditEvent(ev: EventInstance) {
    const original = store.events.find((x) => x.id === ev.id)
    if (!original) return
    setEditingEvent(original)
    setEditingEventInstance(ev.instanceDate)
    setEventDefaults(null)
    setEventOpen(true)
  }

  function openEditTask(id: string) {
    const original = store.tasks.find((x) => x.id === id)
    if (!original) return
    setEditingTask(original)
    setTaskDefaults(null)
    setTaskOpen(true)
  }

  function saveEvent(ev: Event) {
    store.setEvents((prev) => {
      const idx = prev.findIndex((x) => x.id === ev.id)
      if (idx === -1) return [...prev, ev]
      const copy = [...prev]
      copy[idx] = ev
      return copy
    })
  }

  function removeEvent(id: string) {
    store.setEvents((prev) => prev.filter((e) => e.id !== id))
  }

  function skipEvent(id: string, dateISO: string) {
    store.setEvents((prev) =>
      prev.map((e) => (e.id === id ? skipEventInstance(e, dateISO) : e)),
    )
  }

  function saveTask(t: Task) {
    store.setTasks((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id)
      if (idx === -1) return [...prev, t]
      const copy = [...prev]
      copy[idx] = t
      return copy
    })
  }

  function removeTask(id: string) {
    store.setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function toggleTaskInstance(taskId: string, instanceDate: string, done: boolean) {
    const original = store.tasks.find((t) => t.id === taskId)
    if (!original) return
    const next = setTaskInstanceDone(original, instanceDate || date, done)
    saveTask(next)
  }

  function handleSelectItem(item: TimelineItem) {
    if (item.kind === "event") {
      const inst = dayEvents.find(
        (e) => e.id === item.id && e.instanceDate === item.instanceDate,
      )
      if (inst) openEditEvent(inst)
    } else {
      openEditTask(item.id)
    }
  }

  function handleCreate(range: { startTime: string; endTime: string }) {
    setChooseRange(range)
    setChooseOpen(true)
  }

  const isToday = date === todayISO()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Día anterior"
          onClick={() => setDate((d) => shiftISO(d, -1))}
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Día siguiente"
          onClick={() => setDate((d) => shiftISO(d, 1))}
        >
          <ChevronRight />
        </Button>
        <Button
          variant={isToday ? "secondary" : "outline"}
          onClick={() => setDate(todayISO())}
          disabled={isToday}
        >
          <CalendarDays />
          Hoy
        </Button>
        <div className="min-w-0 flex-1 px-2">
          <h2 className="font-heading truncate text-base font-medium">
            {formatDayHeading(date)}
          </h2>
          <p className="text-muted-foreground text-xs">
            {dayEvents.length} {dayEvents.length === 1 ? "evento" : "eventos"} ·{" "}
            {dayTasks.length} {dayTasks.length === 1 ? "tarea" : "tareas"}
          </p>
        </div>
        <Button onClick={() => openCreateEvent()}>
          <Plus />
          Nuevo evento
        </Button>
      </div>

      {allDayTasks.length > 0 && (
        <div className="animate-fade-in bg-muted/40 -mx-1 flex flex-wrap gap-2 rounded-2xl p-3">
          {allDayTasks.map((t) => {
            const project = store.projects.find((p) => p.id === t.projectId)
            return (
              <button
                key={`${t.id}::${t.instanceDate}`}
                onClick={() => toggleTaskInstance(t.id, t.instanceDate, !t.done)}
                className="bg-card hover:bg-accent flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 transition-colors duration-150"
              >
                <Checkbox
                  checked={t.done}
                  onCheckedChange={() =>
                    toggleTaskInstance(t.id, t.instanceDate, !t.done)
                  }
                  aria-label={t.title}
                />
                <span
                  className={
                    t.done
                      ? "text-muted-foreground text-sm line-through"
                      : "text-foreground text-sm"
                  }
                >
                  {t.title}
                </span>
                {project && (
                  <span
                    className={`size-1.5 rounded-full ${colorClass(project.color)}`}
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      <TimelineGrid
        items={timelineItems}
        projects={store.projects}
        date={date}
        isToday={isToday}
        onSelect={handleSelectItem}
        onToggleTask={(t: TimelineTaskItem) =>
          toggleTaskInstance(t.id, t.instanceDate, !t.done)
        }
        onCreate={handleCreate}
      />

      <p className="text-muted-foreground text-center text-xs">
        Arrastra en la rejilla para crear. Toca un bloque para editar.
      </p>

      <EventDialog
        open={eventOpen}
        onOpenChange={(v) => {
          setEventOpen(v)
          if (!v) {
            setEditingEvent(null)
            setEditingEventInstance(null)
            setEventDefaults(null)
          }
        }}
        event={editingEvent}
        instanceDate={editingEventInstance}
        defaults={eventDefaults}
        projects={store.projects}
        onSave={saveEvent}
        onDelete={removeEvent}
        onSkipInstance={skipEvent}
      />

      <TaskDialog
        open={taskOpen}
        onOpenChange={(v) => {
          setTaskOpen(v)
          if (!v) {
            setEditingTask(null)
            setTaskDefaults(null)
          }
        }}
        task={editingTask}
        defaults={taskDefaults}
        projects={store.projects}
        onSave={saveTask}
        onDelete={removeTask}
      />

      <Dialog open={chooseOpen} onOpenChange={setChooseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear en este horario</DialogTitle>
            <DialogDescription>
              {chooseRange?.startTime} – {chooseRange?.endTime}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-1 py-3"
              onClick={() => {
                setChooseOpen(false)
                if (chooseRange) openCreateEvent(chooseRange)
              }}
            >
              <span className="text-sm font-medium">Evento</span>
              <span className="text-muted-foreground text-xs">
                Bloque de tiempo en el calendario
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto flex-col items-start gap-1 py-3"
              onClick={() => {
                setChooseOpen(false)
                if (chooseRange) openCreateTask(chooseRange)
              }}
            >
              <span className="text-sm font-medium">Tarea</span>
              <span className="text-muted-foreground text-xs">
                Algo que tienes que completar
              </span>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setChooseOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
