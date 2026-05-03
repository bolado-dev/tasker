"use client"

import * as React from "react"
import { Pencil, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { ProjectDialog } from "@/components/dialogs/project-dialog"
import { colorClass, type Project, type ProjectStatus } from "@/lib/types"
import type { Store } from "@/lib/store-types"

const STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Activo",
  paused: "En pausa",
  done: "Terminado",
}

const STATUS_BADGE: Record<ProjectStatus, string> = {
  active: "bg-foreground/10 text-foreground border-transparent font-medium",
  paused: "bg-muted text-muted-foreground border-transparent",
  done: "bg-transparent text-muted-foreground/60 border-transparent",
}

export function ProjectsView({ store }: { store: Store }) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Project | null>(null)
  const [tab, setTab] = React.useState<"all" | ProjectStatus>("all")

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
        <Card>
          <CardContent>
            <p className="text-muted-foreground py-10 text-center text-sm">
              No hay proyectos aquí. Crea uno para empezar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((p) => {
            const tasks = store.tasks.filter((t) => t.projectId === p.id)
            const done = tasks.filter((t) => t.done).length
            const pct = tasks.length === 0 ? 0 : (done / tasks.length) * 100
            return (
              <Card key={p.id}>
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
                    <CardDescription className="line-clamp-2">
                      {p.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="h-2 flex-1" />
                    <span className="text-muted-foreground text-xs tabular-nums">
                      {done}/{tasks.length}
                    </span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={STATUS_BADGE[p.status]}>
                      {STATUS_LABEL[p.status]}
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                      {tasks.length} tareas
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
