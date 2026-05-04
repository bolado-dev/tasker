"use client"

import * as React from "react"
import {
  ArrowRight,
  CheckCircle2,
  Flame,
  FolderKanban,
  ListChecks,
  Moon,
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
import { Checkbox } from "@/components/ui/checkbox"
import { CrisisDialog } from "@/components/dialogs/crisis-dialog"
import { RadialChart } from "@/components/radial-chart"
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

const STREAK_MILESTONES = [1, 7, 14, 30, 60, 90, 180, 365]
function nextStreakMilestone(days: number) {
  return STREAK_MILESTONES.find((m) => m > days) ?? days + 30
}

function lastNDates(n: number) {
  const out: string[] = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d)
    dd.setDate(dd.getDate() - i)
    out.push(
      `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}-${String(
        dd.getDate(),
      ).padStart(2, "0")}`,
    )
  }
  return out
}

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
  const tasksFraction = tasksToday.length === 0 ? 0 : doneToday / tasksToday.length

  const activeProjects = store.projects.filter((p) => p.status === "active")
  const longestStreak = store.habits.reduce(
    (max, h) => Math.max(max, daysSince(h.startDate)),
    0,
  )
  const nextMs = nextStreakMilestone(longestStreak)

  const sleepGoal = store.healthGoal.sleepHours ?? 8
  const last7 = lastNDates(7)
  const last7Sleep = store.sleep.filter((s) => last7.includes(s.date))
  const avgSleep =
    last7Sleep.length === 0
      ? 0
      : last7Sleep.reduce((s, x) => s + x.hours, 0) / last7Sleep.length
  const sleepFraction = Math.min(1, avgSleep / sleepGoal)

  const projectsTotal = store.projects.length || 1
  const projectsActiveFrac = activeProjects.length / projectsTotal

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
        <RadialStat
          icon={<ListChecks className="size-4" />}
          label="Tareas hoy"
          value={tasksFraction}
          big={`${doneToday}`}
          small={`/ ${tasksToday.length}`}
          fgClassName="stroke-primary"
          onClick={() => onNavigate("today")}
        />
        <RadialStat
          icon={<Flame className="size-4" />}
          label="Racha más larga"
          value={Math.min(1, longestStreak / nextMs)}
          big={`${longestStreak}`}
          small={`/ ${nextMs} d`}
          fgClassName="stroke-orange-400"
          onClick={() => onNavigate("habits")}
        />
        <RadialStat
          icon={<Moon className="size-4" />}
          label="Sueño 7 días"
          value={sleepFraction}
          big={avgSleep > 0 ? avgSleep.toFixed(1) : "—"}
          small={avgSleep > 0 ? `/ ${sleepGoal} h` : "sin datos"}
          fgClassName="stroke-violet-400"
          onClick={() => onNavigate("health")}
        />
        <RadialStat
          icon={<FolderKanban className="size-4" />}
          label="Proyectos activos"
          value={projectsActiveFrac}
          big={`${activeProjects.length}`}
          small={`/ ${store.projects.length}`}
          fgClassName="stroke-emerald-400"
          onClick={() => onNavigate("projects")}
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
            {tasksToday.length === 0 ? (
              <SmallEmpty
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
              <SmallEmpty
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
                  const next = nextStreakMilestone(days)
                  return (
                    <button
                      key={h.id}
                      onClick={() => onNavigate("habits")}
                      className="hover:bg-muted flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 ease-out"
                    >
                      <RadialChart
                        value={Math.min(1, days / next)}
                        size={44}
                        thickness={4}
                        fgClassName="stroke-orange-400"
                      >
                        <Flame className="text-muted-foreground size-3.5" />
                      </RadialChart>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{h.name}</div>
                        <div className="text-muted-foreground text-xs">
                          Mejor racha: {Math.max(h.bestStreak, days)} d
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
            <SmallEmpty
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
                const frac =
                  projTasks.length === 0 ? 0 : completed / projTasks.length
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate("projects")}
                    className="hover:bg-muted/60 group/proj flex cursor-pointer items-center gap-4 rounded-lg border p-4 text-left transition-colors duration-150 ease-out"
                  >
                    <RadialChart
                      value={frac}
                      size={56}
                      thickness={6}
                      fgClassName={
                        p.color === "blush"
                          ? "stroke-pink-400"
                          : p.color === "lavender"
                            ? "stroke-violet-400"
                            : p.color === "peach"
                              ? "stroke-orange-300"
                              : p.color === "sky"
                                ? "stroke-sky-400"
                                : p.color === "sand"
                                  ? "stroke-amber-400"
                                  : "stroke-emerald-400"
                      }
                    >
                      <span className="text-[10px] font-semibold tabular-nums">
                        {Math.round(frac * 100)}%
                      </span>
                    </RadialChart>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${colorClass(p.color)}`}
                        />
                        <span className="truncate text-sm font-medium">{p.name}</span>
                      </div>
                      {p.description && (
                        <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                          {p.description}
                        </p>
                      )}
                      <div className="text-muted-foreground mt-1.5 text-xs tabular-nums">
                        {completed}/{projTasks.length} tareas
                      </div>
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

function RadialStat({
  icon,
  label,
  value,
  big,
  small,
  fgClassName,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: number
  big: string
  small: string
  fgClassName: string
  onClick?: () => void
}) {
  return (
    <Card
      size="sm"
      className="lift-on-hover cursor-pointer"
      onClick={onClick}
      role="button"
    >
      <CardContent>
        <div className="flex items-center gap-4">
          <RadialChart value={value} size={66} thickness={7} fgClassName={fgClassName}>
            <span className="text-muted-foreground">{icon}</span>
          </RadialChart>
          <div className="min-w-0 flex-1">
            <div className="text-muted-foreground text-xs">{label}</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-2xl font-semibold tabular-nums">
                {big}
              </span>
              <span className="text-muted-foreground text-xs">{small}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SmallEmpty({
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
