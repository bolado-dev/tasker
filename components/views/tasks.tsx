"use client"

import * as React from "react"
import { Filter, ListTodo, Pencil, Plus, Repeat as RepeatIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TaskDialog } from "@/components/dialogs/task-dialog"
import { EmptyState } from "@/components/empty-state"
import { colorClass, type Task } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { isToday, priorityClasses, todayISO } from "@/lib/format"
import {
  describeRepeat,
  expandTasksForDate,
  expandTasksInRange,
  setTaskInstanceDone,
  type TaskInstance,
} from "@/lib/recurrence"

type StatusFilter = "all" | "open" | "done" | "today" | "overdue"

const RANGE_DAYS = 30

function shiftISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function TasksView({ store }: { store: Store }) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Task | null>(null)
  const [project, setProject] = React.useState<string>("all")
  const [priority, setPriority] = React.useState<string>("all")
  const [status, setStatus] = React.useState<StatusFilter>("all")

  const today = todayISO()

  const expanded = React.useMemo<TaskInstance[]>(() => {
    if (status === "today") return expandTasksForDate(store.tasks, today)
    if (status === "overdue") {
      const oneShots = store.tasks.filter(
        (t) => (!t.repeat || t.repeat === "none") && t.dueDate && t.dueDate < today,
      )
      return oneShots.map((t) => ({ ...t, instanceDate: t.dueDate!, isInstance: false }))
    }
    // For other filters: show all one-shots + upcoming N days of recurring instances
    const oneShots: TaskInstance[] = store.tasks
      .filter((t) => !t.repeat || t.repeat === "none")
      .map((t) => ({
        ...t,
        instanceDate: t.dueDate ?? "",
        isInstance: false,
      }))
    const future = expandTasksInRange(
      store.tasks.filter((t) => t.repeat && t.repeat !== "none"),
      today,
      shiftISO(today, RANGE_DAYS),
    )
    return [...oneShots, ...future]
  }, [store.tasks, today, status])

  const filtered = React.useMemo(() => {
    return expanded
      .filter((t) => {
        if (project !== "all" && t.projectId !== project) return false
        if (priority !== "all" && t.priority !== priority) return false
        if (status === "open" && t.done) return false
        if (status === "done" && !t.done) return false
        return true
      })
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        const dateA = a.instanceDate || "9999"
        const dateB = b.instanceDate || "9999"
        if (dateA !== dateB) return dateA.localeCompare(dateB)
        const order = { high: 0, med: 1, low: 2 } as const
        return order[a.priority] - order[b.priority]
      })
  }, [expanded, project, priority, status])

  function toggle(inst: TaskInstance) {
    const original = store.tasks.find((t) => t.id === inst.id)
    if (!original) return
    const next = setTaskInstanceDone(original, inst.instanceDate || today, !inst.done)
    save(next)
  }

  function save(t: Task) {
    store.setTasks((prev) => {
      const idx = prev.findIndex((x) => x.id === t.id)
      if (idx === -1) return [...prev, t]
      const copy = [...prev]
      copy[idx] = t
      return copy
    })
  }

  function remove(id: string) {
    store.setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="text-muted-foreground size-4" />
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Próximas</SelectItem>
              <SelectItem value="open">Pendientes</SelectItem>
              <SelectItem value="done">Hechas</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="overdue">Atrasadas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier prioridad</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="med">Media</SelectItem>
              <SelectItem value="low">Baja</SelectItem>
            </SelectContent>
          </Select>
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Proyecto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los proyectos</SelectItem>
              {store.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus />
          Nueva tarea
        </Button>
      </div>

      {filtered.length === 0 && store.tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Sin tareas todavía"
          description="Crea tu primera tarea. Algo concreto que puedas marcar como hecho."
          action={
            <Button
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
            >
              <Plus />
              Crear tarea
            </Button>
          }
        />
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} tareas</CardTitle>
          <CardDescription>
            Toca una tarea para editarla. Las recurrentes aparecen en cada día que tocan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              No hay tareas con estos filtros.
            </p>
          ) : (
            <ul className="animate-stagger divide-foreground/5 divide-y">
              {filtered.map((t) => {
                const proj = store.projects.find((p) => p.id === t.projectId)
                const overdue =
                  !t.done && t.instanceDate && t.instanceDate < today
                return (
                  <li
                    key={`${t.id}::${t.instanceDate}`}
                    className="flex items-start gap-3 py-3"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={t.done}
                      onCheckedChange={() => toggle(t)}
                      aria-label={t.title}
                    />
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        const original = store.tasks.find((x) => x.id === t.id)
                        if (original) {
                          setEditing(original)
                          setOpen(true)
                        }
                      }}
                    >
                      <div
                        className={
                          t.done
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }
                      >
                        {t.title}
                      </div>
                      {t.notes && (
                        <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                          {t.notes}
                        </p>
                      )}
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                        <Badge variant="outline" className={priorityClasses(t.priority)}>
                          {t.priority === "high"
                            ? "Alta"
                            : t.priority === "med"
                              ? "Media"
                              : "Baja"}
                        </Badge>
                        {proj && (
                          <span className="text-muted-foreground inline-flex items-center gap-1">
                            <span
                              className={`size-1.5 rounded-full ${colorClass(proj.color)}`}
                            />
                            {proj.name}
                          </span>
                        )}
                        {t.repeat && t.repeat !== "none" && (
                          <span className="text-muted-foreground inline-flex items-center gap-1">
                            <RepeatIcon className="size-3" />
                            {describeRepeat(t.repeat)}
                          </span>
                        )}
                        {t.instanceDate && (
                          <span
                            className={
                              overdue
                                ? "text-destructive/80"
                                : isToday(t.instanceDate)
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                            }
                          >
                            {isToday(t.instanceDate)
                              ? "Hoy"
                              : overdue
                                ? `Atrasada · ${t.instanceDate}`
                                : t.instanceDate}
                          </span>
                        )}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        const original = store.tasks.find((x) => x.id === t.id)
                        if (original) {
                          setEditing(original)
                          setOpen(true)
                        }
                      }}
                      aria-label="Editar"
                    >
                      <Pencil />
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
      )}

      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        task={editing}
        projects={store.projects}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}
