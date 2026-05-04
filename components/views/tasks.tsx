"use client"

import * as React from "react"
import {
  ChevronDown,
  Filter,
  ListChecks,
  ListTodo,
  Pencil,
  Plus,
  Repeat as RepeatIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { TaskDialog } from "@/components/dialogs/task-dialog"
import { EmptyState } from "@/components/empty-state"
import { RadialChart } from "@/components/radial-chart"
import { colorClass, type Project, type Task } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { isToday, priorityClasses, todayISO } from "@/lib/format"
import {
  describeRepeat,
  expandTasksForDate,
  expandTasksInRange,
  setTaskInstanceDone,
  type TaskInstance,
} from "@/lib/recurrence"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "open" | "done" | "today" | "overdue"
type Layout = "list" | "by-project"

const RANGE_DAYS = 30
const NO_PROJECT = "__none__"

function shiftISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const PROJECT_RADIAL: Record<string, string> = {
  lavender: "stroke-violet-400",
  blush: "stroke-pink-400",
  mint: "stroke-emerald-400",
  peach: "stroke-orange-300",
  sky: "stroke-sky-400",
  sand: "stroke-amber-400",
}

export function TasksView({ store }: { store: Store }) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Task | null>(null)
  const [project, setProject] = React.useState<string>("all")
  const [priority, setPriority] = React.useState<string>("all")
  const [status, setStatus] = React.useState<StatusFilter>("all")
  const [layout, setLayout] = React.useState<Layout>("by-project")
  const [collapsed, setCollapsed] = React.useState<Record<string, boolean>>({})

  const today = todayISO()

  const expanded = React.useMemo<TaskInstance[]>(() => {
    if (status === "today") return expandTasksForDate(store.tasks, today)
    if (status === "overdue") {
      const oneShots = store.tasks.filter(
        (t) => (!t.repeat || t.repeat === "none") && t.dueDate && t.dueDate < today,
      )
      return oneShots.map((t) => ({ ...t, instanceDate: t.dueDate!, isInstance: false }))
    }
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

  const grouped = React.useMemo(() => {
    const map = new Map<string, TaskInstance[]>()
    for (const t of filtered) {
      const key = t.projectId ?? NO_PROJECT
      const arr = map.get(key)
      if (arr) arr.push(t)
      else map.set(key, [t])
    }
    const order: { id: string; project: Project | null; tasks: TaskInstance[] }[] = []
    for (const p of store.projects) {
      if (map.has(p.id)) {
        order.push({ id: p.id, project: p, tasks: map.get(p.id)! })
      }
    }
    if (map.has(NO_PROJECT)) {
      order.push({ id: NO_PROJECT, project: null, tasks: map.get(NO_PROJECT)! })
    }
    return order
  }, [filtered, store.projects])

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

  const [createDefaults, setCreateDefaults] = React.useState<{
    projectId?: string
  } | null>(null)

  function openCreate(projectId?: string) {
    setEditing(null)
    setCreateDefaults(projectId ? { projectId } : null)
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="text-muted-foreground size-4 shrink-0" />
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
        <div className="flex items-center gap-2">
          <Tabs value={layout} onValueChange={(v) => setLayout(v as Layout)}>
            <TabsList>
              <TabsTrigger value="by-project">Por proyecto</TabsTrigger>
              <TabsTrigger value="list">Lista</TabsTrigger>
            </TabsList>
            <TabsContent value={layout} />
          </Tabs>
          <Button onClick={() => openCreate()}>
            <Plus />
            Nueva tarea
          </Button>
        </div>
      </div>

      {filtered.length === 0 && store.tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Sin tareas todavía"
          description="Crea tu primera tarea. Algo concreto que puedas marcar como hecho."
          action={
            <Button onClick={() => openCreate()}>
              <Plus />
              Crear tarea
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground py-10 text-center text-sm">
              No hay tareas con estos filtros.
            </p>
          </CardContent>
        </Card>
      ) : layout === "list" ? (
        <Card>
          <CardContent>
            <ul className="divide-y">
              {filtered.map((t) => (
                <TaskRow
                  key={`${t.id}::${t.instanceDate}`}
                  task={t}
                  project={store.projects.find((p) => p.id === t.projectId) ?? null}
                  today={today}
                  onToggle={() => toggle(t)}
                  onEdit={() => {
                    const original = store.tasks.find((x) => x.id === t.id)
                    if (original) {
                      setEditing(original)
                      setOpen(true)
                    }
                  }}
                  showProjectChip
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ id, project: p, tasks }) => {
            const total = tasks.length
            const done = tasks.filter((t) => t.done).length
            const frac = total === 0 ? 0 : done / total
            const isCollapsed = collapsed[id]
            return (
              <Card key={id} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
                  }
                  className="hover:bg-muted/40 flex w-full cursor-pointer items-center gap-4 px-6 py-4 text-left transition-colors"
                >
                  <RadialChart
                    value={frac}
                    size={48}
                    thickness={5}
                    fgClassName={
                      p ? PROJECT_RADIAL[p.color] ?? "stroke-primary" : "stroke-muted-foreground"
                    }
                  >
                    <span className="text-[10px] font-semibold tabular-nums">
                      {Math.round(frac * 100)}%
                    </span>
                  </RadialChart>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {p ? (
                        <>
                          <span
                            className={`size-2 rounded-full ${colorClass(p.color)}`}
                          />
                          <span className="font-medium truncate">{p.name}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground font-medium">
                          Sin proyecto
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground mt-0.5 text-xs tabular-nums">
                      {done} / {total} {total === 1 ? "tarea" : "tareas"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {p && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          openCreate(p.id)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            openCreate(p.id)
                          }
                        }}
                        aria-label="Añadir tarea a este proyecto"
                        className="hover:bg-accent inline-flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors"
                      >
                        <Plus className="size-4" />
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "text-muted-foreground size-4 transition-transform",
                        isCollapsed && "-rotate-90",
                      )}
                    />
                  </div>
                </button>
                {!isCollapsed && (
                  <CardContent className="border-t pt-0">
                    <ul className="divide-y">
                      {tasks.map((t) => (
                        <TaskRow
                          key={`${t.id}::${t.instanceDate}`}
                          task={t}
                          project={null}
                          today={today}
                          onToggle={() => toggle(t)}
                          onEdit={() => {
                            const original = store.tasks.find((x) => x.id === t.id)
                            if (original) {
                              setEditing(original)
                              setOpen(true)
                            }
                          }}
                        />
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <TaskDialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v)
          if (!v) {
            setEditing(null)
            setCreateDefaults(null)
          }
        }}
        task={editing}
        defaults={createDefaults}
        projects={store.projects}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}

function TaskRow({
  task,
  project,
  today,
  onToggle,
  onEdit,
  showProjectChip,
}: {
  task: TaskInstance
  project: Project | null
  today: string
  onToggle: () => void
  onEdit: () => void
  showProjectChip?: boolean
}) {
  const overdue = !task.done && task.instanceDate && task.instanceDate < today
  return (
    <li className="flex items-start gap-3 py-3">
      <Checkbox
        className="mt-0.5"
        checked={task.done}
        onCheckedChange={onToggle}
        aria-label={task.title}
      />
      <button
        type="button"
        className="min-w-0 flex-1 cursor-pointer text-left"
        onClick={onEdit}
      >
        <div
          className={
            task.done
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }
        >
          {task.title}
        </div>
        {task.notes && (
          <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {task.notes}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
          <Badge variant="outline" className={priorityClasses(task.priority)}>
            {task.priority === "high"
              ? "Alta"
              : task.priority === "med"
                ? "Media"
                : "Baja"}
          </Badge>
          {task.subtasks && task.subtasks.length > 0 && (
            <span className="text-muted-foreground inline-flex items-center gap-1 tabular-nums">
              <ListChecks className="size-3" />
              {task.subtasks.filter((s) => s.done).length}/{task.subtasks.length}
            </span>
          )}
          {showProjectChip && project && (
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <span className={`size-1.5 rounded-full ${colorClass(project.color)}`} />
              {project.name}
            </span>
          )}
          {task.repeat && task.repeat !== "none" && (
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <RepeatIcon className="size-3" />
              {describeRepeat(task.repeat)}
            </span>
          )}
          {task.instanceDate && (
            <span
              className={
                overdue
                  ? "text-destructive/80"
                  : isToday(task.instanceDate)
                    ? "text-foreground font-medium"
                    : "text-muted-foreground"
              }
            >
              {isToday(task.instanceDate)
                ? "Hoy"
                : overdue
                  ? `Atrasada · ${task.instanceDate}`
                  : task.instanceDate}
            </span>
          )}
        </div>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onEdit}
        aria-label="Editar"
      >
        <Pencil />
      </Button>
    </li>
  )
}
