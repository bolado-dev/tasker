"use client"

import * as React from "react"
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  FolderKanban,
  Heart,
  ListChecks,
  Quote,
} from "lucide-react"

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
import { Checkbox } from "@/components/ui/checkbox"
import { CrisisDialog } from "@/components/dialogs/crisis-dialog"
import { colorClass, type View } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { daysSince, priorityClasses, todayISO } from "@/lib/format"
import {
  expandTasksForDate,
  setTaskInstanceDone,
  type TaskInstance,
} from "@/lib/recurrence"

const QUOTES = [
  "Cada minuto invertido aquí es un minuto que la adicción no te roba.",
  "No tienes que ganar para siempre. Solo gana hoy.",
  "El aburrimiento es el caldo de cultivo de las recaídas. Llénalo de algo bueno.",
  "Pequeñas decisiones repetidas se vuelven una vida nueva.",
  "Tu yo de mañana te está mirando ahora mismo. Hazlo orgulloso.",
]

export function OverviewView({
  store,
  onNavigate,
}: {
  store: Store
  onNavigate: (v: View) => void
}) {
  const today = todayISO()
  const tasksToday: TaskInstance[] = React.useMemo(
    () => expandTasksForDate(store.tasks, today),
    [store.tasks, today],
  )
  const doneToday = tasksToday.filter((t) => t.done).length
  const progress = tasksToday.length === 0 ? 0 : (doneToday / tasksToday.length) * 100

  const activeProjects = store.projects.filter((p) => p.status === "active")
  const longestStreak = store.habits.reduce(
    (max, h) => Math.max(max, daysSince(h.startDate)),
    0,
  )
  const totalDaysClean = store.habits.reduce((acc, h) => acc + daysSince(h.startDate), 0)

  const quote = React.useMemo(() => {
    const idx = new Date().getDate() % QUOTES.length
    return QUOTES[idx]
  }, [])

  function toggleTask(inst: TaskInstance) {
    const original = store.tasks.find((t) => t.id === inst.id)
    if (!original) return
    const next = setTaskInstanceDone(original, inst.instanceDate || today, !inst.done)
    store.setTasks((prev) => {
      const idx = prev.findIndex((x) => x.id === next.id)
      if (idx === -1) return [...prev, next]
      const copy = [...prev]
      copy[idx] = next
      return copy
    })
  }

  return (
    <div className="space-y-6">
      <Card className="bg-accent/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-card text-muted-foreground flex size-10 items-center justify-center rounded-2xl">
              <Quote className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base">Hoy es un buen día para seguir.</CardTitle>
              <CardDescription className="mt-1">{quote}</CardDescription>
            </div>
            <CrisisDialog />
          </div>
        </CardHeader>
      </Card>

      <div className="animate-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Flame className="size-4" />}
          label="Racha más larga"
          value={`${longestStreak}`}
          unit="días"
        />
        <StatCard
          icon={<Heart className="size-4" />}
          label="Total días ganados"
          value={`${totalDaysClean}`}
          unit="días"
        />
        <StatCard
          icon={<ListChecks className="size-4" />}
          label="Tareas hoy"
          value={`${doneToday}`}
          unit={`/ ${tasksToday.length}`}
        />
        <StatCard
          icon={<FolderKanban className="size-4" />}
          label="Proyectos activos"
          value={`${activeProjects.length}`}
          unit=""
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Tareas de hoy</CardTitle>
                <CardDescription>Ocupa tu mente con lo que importa.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate("tasks")}>
                Ver todas <ArrowRight />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-muted-foreground text-xs tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
            {tasksToday.length === 0 ? (
              <EmptyState
                title="No hay tareas para hoy"
                hint="Agenda algo en Tareas para llenar el día."
                action={
                  <Button size="sm" onClick={() => onNavigate("tasks")}>
                    Ir a Tareas
                  </Button>
                }
              />
            ) : (
              <ul className="animate-stagger divide-foreground/5 divide-y">
                {tasksToday.slice(0, 6).map((t) => {
                  const project = store.projects.find((p) => p.id === t.projectId)
                  return (
                    <li
                      key={`${t.id}::${t.instanceDate}`}
                      className="flex items-center gap-3 py-2.5"
                    >
                      <Checkbox
                        checked={t.done}
                        onCheckedChange={() => toggleTask(t)}
                        aria-label={t.title}
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={
                            t.done
                              ? "text-muted-foreground line-through"
                              : "text-foreground"
                          }
                        >
                          {t.title}
                        </div>
                        {project && (
                          <div className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-xs">
                            <span
                              className={`size-1.5 rounded-full ${colorClass(project.color)}`}
                            />
                            {project.name}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={priorityClasses(t.priority)}
                      >
                        {t.priority === "high"
                          ? "Alta"
                          : t.priority === "med"
                            ? "Media"
                            : "Baja"}
                      </Badge>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tus rachas</CardTitle>
            <CardDescription>Cada día limpio cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            {store.habits.length === 0 ? (
              <EmptyState
                title="Sin hábitos aún"
                hint="Crea uno en Hábitos para empezar a contar."
                action={
                  <Button size="sm" onClick={() => onNavigate("habits")}>
                    Crear hábito
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {store.habits.slice(0, 4).map((h) => {
                  const days = daysSince(h.startDate)
                  return (
                    <button
                      key={h.id}
                      onClick={() => onNavigate("habits")}
                      className="hover:bg-muted -mx-2 flex w-[calc(100%+1rem)] cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 text-left transition-all duration-200 ease-out hover:translate-x-0.5 active:scale-[0.99]"
                    >
                      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-2xl">
                        <Flame className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{h.name}</div>
                        <div className="text-muted-foreground text-xs">
                          Mejor racha: {h.bestStreak} d
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-heading text-lg leading-none font-semibold tabular-nums">
                          {days}
                        </div>
                        <div className="text-muted-foreground text-[10px]">días</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Proyectos activos</CardTitle>
              <CardDescription>En lo que vale la pena invertir tu tiempo.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onNavigate("projects")}>
              Ver todos <ArrowRight />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeProjects.length === 0 ? (
            <EmptyState
              title="Sin proyectos activos"
              hint="Define en qué quieres invertir tu energía."
              action={
                <Button size="sm" onClick={() => onNavigate("projects")}>
                  Crear proyecto
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeProjects.map((p) => {
                const projTasks = store.tasks.filter((t) => t.projectId === p.id)
                const completed = projTasks.filter((t) => t.done).length
                const pct =
                  projTasks.length === 0 ? 0 : (completed / projTasks.length) * 100
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate("projects")}
                    className="bg-muted/50 hover:bg-muted group/proj cursor-pointer rounded-2xl p-4 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${colorClass(p.color)}`} />
                      <span className="truncate text-sm font-medium">{p.name}</span>
                    </div>
                    {p.description && (
                      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-xs">
                        {p.description}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-2">
                      <Progress value={pct} className="h-1 flex-1" />
                      <span className="text-muted-foreground text-xs tabular-nums">
                        {completed}/{projTasks.length}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
}) {
  return (
    <Card
      size="sm"
      className="lift-on-hover hover:shadow-[0_2px_4px_rgb(0_0_0/0.04),0_12px_28px_-12px_rgb(0_0_0/0.10)]"
    >
      <CardContent>
        <div className="flex items-start gap-3">
          <div className="bg-muted text-muted-foreground group-hover/card:bg-primary/10 group-hover/card:text-primary flex size-9 shrink-0 items-center justify-center rounded-2xl transition-colors duration-200">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-2xl font-semibold tabular-nums">
                {value}
              </span>
              <span className="text-muted-foreground text-xs">{unit}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-2xl">
        <CheckCircle2 className="size-5" />
      </div>
      <div className="text-sm font-medium">{title}</div>
      <div className="text-muted-foreground max-w-xs text-xs">{hint}</div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
