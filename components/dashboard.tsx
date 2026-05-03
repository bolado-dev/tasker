"use client"

import * as React from "react"
import {
  Activity,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  Cloud,
  CloudOff,
  Flame,
  FolderKanban,
  LayoutDashboard,
  ListTodo,
  Loader2,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useIsClient, useTasker } from "@/lib/storage"
import { useSpaceCode, useSpaceSync, type SyncStatus } from "@/lib/sync"
import { daysSince, formatLongDate, todayISO } from "@/lib/format"
import type { View } from "@/lib/types"

import { OverviewView } from "@/components/views/overview"
import { TodayView } from "@/components/views/today"
import { TasksView } from "@/components/views/tasks"
import { ProjectsView } from "@/components/views/projects"
import { HabitsView } from "@/components/views/habits"
import { SpaceDialog } from "@/components/dialogs/space-dialog"
import { InstallButton } from "@/components/install-button"

type NavItem = {
  id: View
  label: string
  icon: React.ComponentType<{ className?: string }>
  hint: string
}

const NAV: NavItem[] = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard, hint: "Tu día en una vista" },
  { id: "today", label: "Hoy", icon: CalendarDays, hint: "Rutina y tareas de hoy" },
  { id: "tasks", label: "Tareas", icon: ListTodo, hint: "Todo lo que tienes que hacer" },
  { id: "projects", label: "Proyectos", icon: FolderKanban, hint: "En qué inviertes tu tiempo" },
  { id: "habits", label: "Hábitos", icon: Flame, hint: "Rachas para dejar adicciones" },
]

export function Dashboard() {
  const store = useTasker()
  const [view, setView] = React.useState<View>("overview")
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [spaceOpen, setSpaceOpen] = React.useState(false)

  const [code, setCode] = useSpaceCode()
  const snapshot = React.useMemo(
    () => ({
      tasks: store.tasks,
      projects: store.projects,
      habits: store.habits,
      routine: store.routine,
    }),
    [store.tasks, store.projects, store.habits, store.routine],
  )
  const sync = useSpaceSync({ code, hydrated: store.hydrated, snapshot })

  const today = todayISO()
  const tasksToday = store.hydrated
    ? store.tasks.filter((t) => t.dueDate === today)
    : []
  const doneToday = tasksToday.filter((t) => t.done).length
  const bestStreak = store.hydrated
    ? store.habits.reduce((max, h) => Math.max(max, daysSince(h.startDate)), 0)
    : 0

  const Title = NAV.find((n) => n.id === view)?.label ?? "Resumen"
  const Hint = NAV.find((n) => n.id === view)?.hint ?? ""

  return (
    <div className="bg-background text-foreground flex min-h-svh">
      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground border-sidebar-border fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-2 px-5 pt-6 pb-4">
          <div className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-2xl">
            <Activity className="size-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-heading text-base font-semibold">Tasker</span>
            <span className="text-muted-foreground text-xs">Tu tiempo, bien usado</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            className="ml-auto md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú"
          >
            <X />
          </Button>
        </div>

        <Separator className="bg-sidebar-border" />

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = item.id === view
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id)
                  setMobileOpen(false)
                }}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <Separator className="bg-sidebar-border" />

        <div className="space-y-3 p-4">
          <div className="bg-sidebar-accent/40 rounded-2xl p-3">
            <div className="text-muted-foreground text-xs">Racha más larga</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-2xl font-semibold">{bestStreak}</span>
              <span className="text-muted-foreground text-xs">días</span>
            </div>
          </div>
          <div className="bg-sidebar-accent/40 rounded-2xl p-3">
            <div className="text-muted-foreground text-xs">Tareas de hoy</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="font-heading text-2xl font-semibold">{doneToday}</span>
              <span className="text-muted-foreground text-xs">/ {tasksToday.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-20 flex items-center gap-3 border-b px-4 py-3 backdrop-blur md:px-8">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading truncate text-lg font-semibold">{Title}</h1>
            <p className="text-muted-foreground truncate text-xs">
              {formatLongDate()} · {Hint}
            </p>
          </div>
          <InstallButton />
          <SyncBadge status={sync} hasCode={!!code} onClick={() => setSpaceOpen(true)} />
          <ThemeToggle />
        </header>

        <div className="flex-1 px-4 py-6 md:px-8 md:py-8">
          {!store.hydrated ? (
            <div className="text-muted-foreground text-sm">Cargando…</div>
          ) : view === "overview" ? (
            <OverviewView store={store} onNavigate={setView} />
          ) : view === "today" ? (
            <TodayView store={store} />
          ) : view === "tasks" ? (
            <TasksView store={store} />
          ) : view === "projects" ? (
            <ProjectsView store={store} />
          ) : (
            <HabitsView store={store} />
          )}
        </div>
      </main>

      <SpaceDialog
        open={spaceOpen}
        onOpenChange={setSpaceOpen}
        currentCode={code}
        onApply={setCode}
      />
    </div>
  )
}

function SyncBadge({
  status,
  hasCode,
  onClick,
}: {
  status: SyncStatus
  hasCode: boolean
  onClick: () => void
}) {
  let icon: React.ReactNode
  let label: string
  let tone = "text-muted-foreground"
  if (!hasCode) {
    icon = <CloudOff className="size-4" />
    label = "Solo en este dispositivo. Toca para sincronizar."
  } else if (status.kind === "pulling") {
    icon = <Loader2 className="size-4 animate-spin" />
    label = "Cargando del espacio…"
  } else if (status.kind === "pushing") {
    icon = <Loader2 className="size-4 animate-spin" />
    label = "Guardando en la nube…"
  } else if (status.kind === "error") {
    icon = <CircleAlert className="size-4" />
    tone = "text-destructive"
    label = `Error: ${status.message}`
  } else if (status.kind === "idle") {
    icon = <CircleCheck className="size-4" />
    tone = "text-emerald-500"
    label = "Sincronizado"
  } else {
    icon = <Cloud className="size-4" />
    label = "Sin sincronizar"
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClick}
          aria-label={label}
          className={tone}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const mounted = useIsClient()
  const isDark = resolvedTheme === "dark"
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? isDark ? <Sun /> : <Moon /> : <Sun />}
    </Button>
  )
}
