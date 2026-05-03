"use client"

import * as React from "react"
import { Filter, Pencil, Plus } from "lucide-react"

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
import { colorClass, type Task } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { isToday, priorityClasses, todayISO } from "@/lib/format"

type StatusFilter = "all" | "open" | "done" | "today" | "overdue"

export function TasksView({ store }: { store: Store }) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Task | null>(null)
  const [project, setProject] = React.useState<string>("all")
  const [priority, setPriority] = React.useState<string>("all")
  const [status, setStatus] = React.useState<StatusFilter>("all")

  const today = todayISO()

  const filtered = store.tasks
    .filter((t) => {
      if (project !== "all" && t.projectId !== project) return false
      if (priority !== "all" && t.priority !== priority) return false
      if (status === "open" && t.done) return false
      if (status === "done" && !t.done) return false
      if (status === "today" && !isToday(t.dueDate)) return false
      if (status === "overdue") {
        if (t.done) return false
        if (!t.dueDate) return false
        if (t.dueDate >= today) return false
      }
      return true
    })
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      const order = { high: 0, med: 1, low: 2 } as const
      const p = order[a.priority] - order[b.priority]
      if (p !== 0) return p
      return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999")
    })

  function toggle(id: string) {
    store.setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined }
          : t,
      ),
    )
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
              <SelectItem value="all">Todas</SelectItem>
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

      <Card>
        <CardHeader>
          <CardTitle>{filtered.length} tareas</CardTitle>
          <CardDescription>Toca una tarea para editarla.</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              No hay tareas con estos filtros.
            </p>
          ) : (
            <ul className="divide-foreground/5 divide-y">
              {filtered.map((t) => {
                const proj = store.projects.find((p) => p.id === t.projectId)
                const overdue =
                  !t.done && t.dueDate && t.dueDate < today
                return (
                  <li key={t.id} className="flex items-start gap-3 py-3">
                    <Checkbox
                      className="mt-0.5"
                      checked={t.done}
                      onCheckedChange={() => toggle(t.id)}
                      aria-label={t.title}
                    />
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => {
                        setEditing(t)
                        setOpen(true)
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
                        {t.dueDate && (
                          <span
                            className={
                              overdue
                                ? "text-destructive/80"
                                : isToday(t.dueDate)
                                  ? "text-foreground font-medium"
                                  : "text-muted-foreground"
                            }
                          >
                            {isToday(t.dueDate)
                              ? "Hoy"
                              : overdue
                                ? `Atrasada · ${t.dueDate}`
                                : t.dueDate}
                          </span>
                        )}
                      </div>
                    </button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(t)
                        setOpen(true)
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
