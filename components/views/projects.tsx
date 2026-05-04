"use client"

import * as React from "react"
import {
  CalendarDays,
  CheckCircle2,
  FolderKanban,
  ListChecks,
  Pencil,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ProjectDialog } from "@/components/dialogs/project-dialog"
import { EmptyState } from "@/components/empty-state"
import { RadialChart } from "@/components/radial-chart"
import { colorClass, type Project, type ProjectStatus, type Task } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { todayISO } from "@/lib/format"

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Activo",
  paused: "En pausa",
  done: "Terminado",
}

const STATUS_BADGE: Record<ProjectStatus, string> = {
  active: "bg-primary/15 text-primary border-transparent font-medium",
  paused: "bg-muted text-muted-foreground border-transparent",
  done: "bg-transparent text-muted-foreground/60 border-transparent",
}

const RADIAL_COLOR: Record<string, string> = {
  lavender: "stroke-violet-400",
  blush: "stroke-pink-400",
  mint: "stroke-emerald-400",
  peach: "stroke-orange-300",
  sky: "stroke-sky-400",
  sand: "stroke-amber-400",
}

function radialColor(name: string) {
  return RADIAL_COLOR[name] ?? "stroke-primary"
}

function isOverdue(task: Task, today: string) {
  if (task.done) return false
  if (!task.dueDate) return false
  return task.dueDate < today
}

export function ProjectsView({ store }: { store: Store }) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Project | null>(null)
  const [tab, setTab] = React.useState<"all" | ProjectStatus>("all")
  const today = todayISO()

  function save(p: Project) {
    store.setProjects((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id)
      if (idx === -1) return [...prev, p]
      const copy = [...prev]
      copy[idx] = p
      return copy
    })
  }

  function remove(id: string) {
    store.setProjects((prev) => prev.filter((p) => p.id !== id))
    store.setTasks((prev) =>
      prev.map((t) => (t.projectId === id ? { ...t, projectId: undefined } : t)),
    )
  }

  const visible = store.projects.filter((p) => tab === "all" || p.status === tab)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Activos</TabsTrigger>
            <TabsTrigger value="paused">En pausa</TabsTrigger>
            <TabsTrigger value="done">Terminados</TabsTrigger>
          </TabsList>
          <TabsContent value={tab} />
        </Tabs>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus />
          Nuevo proyecto
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={store.projects.length === 0 ? "Sin proyectos todavía" : "Nada aquí"}
          description={
            store.projects.length === 0
              ? "Define en qué quieres invertir tu tiempo. Salud, aprender, vida personal — empieza con uno."
              : "No hay proyectos en este estado."
          }
          action={
            store.projects.length === 0 ? (
              <Button
                onClick={() => {
                  setEditing(null)
                  setOpen(true)
                }}
              >
                <Plus />
                Crear proyecto
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="animate-stagger grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const tasks = store.tasks.filter((t) => t.projectId === p.id)
            const done = tasks.filter((t) => t.done).length
            const overdue = tasks.filter((t) => isOverdue(t, today)).length
            const upcoming = tasks.filter(
              (t) => !t.done && t.dueDate && t.dueDate >= today,
            ).length
            const pct = tasks.length === 0 ? 0 : done / tasks.length
            return (
              <Card
                key={p.id}
                className="lift-on-hover"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={`size-3 rounded-full ${colorClass(p.color)}`}
                      />
                      <CardTitle className="truncate">{p.name}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(p)
                        setOpen(true)
                      }}
                      aria-label="Editar"
                    >
                      <Pencil />
                    </Button>
                  </div>
                  {p.description && (
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {p.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-5">
                    <RadialChart
                      value={pct}
                      size={108}
                      thickness={10}
                      fgClassName={radialColor(p.color)}
                      trackClassName="stroke-muted"
                    >
                      <div className="flex flex-col items-center leading-none">
                        <span className="font-heading text-2xl font-semibold tabular-nums">
                          {Math.round(pct * 100)}
                          <span className="text-muted-foreground text-sm font-normal">
                            %
                          </span>
                        </span>
                        <span className="text-muted-foreground mt-1 text-[10px] uppercase tracking-wide">
                          completado
                        </span>
                      </div>
                    </RadialChart>

                    <div className="grid flex-1 gap-2.5">
                      <Stat
                        icon={<ListChecks className="size-3.5" />}
                        label="Total"
                        value={tasks.length}
                      />
                      <Stat
                        icon={<CheckCircle2 className="size-3.5" />}
                        label="Hechas"
                        value={done}
                      />
                      <Stat
                        icon={<CalendarDays className="size-3.5" />}
                        label="Próximas"
                        value={upcoming}
                      />
                      {overdue > 0 && (
                        <Stat
                          icon={<CalendarDays className="size-3.5" />}
                          label="Atrasadas"
                          value={overdue}
                          tone="destructive"
                        />
                      )}
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={STATUS_BADGE[p.status]}>
                      {STATUS_LABEL[p.status]}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {done}/{tasks.length} tareas
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ProjectDialog
        open={open}
        onOpenChange={setOpen}
        project={editing}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone?: "default" | "destructive"
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
      <span
        className={
          tone === "destructive"
            ? "text-destructive font-medium tabular-nums"
            : "text-foreground font-medium tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  )
}
