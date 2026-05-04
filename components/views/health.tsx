"use client"

import * as React from "react"
import {
  Heart,
  HeartPulse,
  Moon,
  Pencil,
  Plus,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
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
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/empty-state"
import { RadialChart } from "@/components/radial-chart"
import { Sparkline } from "@/components/sparkline"
import { SleepDialog } from "@/components/dialogs/sleep-dialog"
import { WeightDialog } from "@/components/dialogs/weight-dialog"
import { HealthGoalDialog } from "@/components/dialogs/health-goal-dialog"
import type { SleepEntry, WeightEntry } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { todayISO } from "@/lib/format"

function lastNDays(n: number): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const dd = new Date(d)
    dd.setDate(dd.getDate() - i)
    const y = dd.getFullYear()
    const m = String(dd.getMonth() + 1).padStart(2, "0")
    const day = String(dd.getDate()).padStart(2, "0")
    out.push(`${y}-${m}-${day}`)
  }
  return out
}

export function HealthView({ store }: { store: Store }) {
  const [sleepOpen, setSleepOpen] = React.useState(false)
  const [editingSleep, setEditingSleep] = React.useState<SleepEntry | null>(null)
  const [weightOpen, setWeightOpen] = React.useState(false)
  const [editingWeight, setEditingWeight] = React.useState<WeightEntry | null>(null)
  const [goalOpen, setGoalOpen] = React.useState(false)

  const sleepGoal = store.healthGoal.sleepHours ?? 8
  const weightGoal = store.healthGoal.weightKg

  const sortedSleep = React.useMemo(
    () => [...store.sleep].sort((a, b) => a.date.localeCompare(b.date)),
    [store.sleep],
  )
  const sortedWeight = React.useMemo(
    () => [...store.weight].sort((a, b) => a.date.localeCompare(b.date)),
    [store.weight],
  )

  // Build last 14 days sleep data, filling missing with 0
  const sleep14 = React.useMemo(() => {
    const days = lastNDays(14)
    const map = new Map(sortedSleep.map((s) => [s.date, s]))
    return days.map((d) => ({ x: d, y: map.get(d)?.hours ?? 0 }))
  }, [sortedSleep])

  const weeklySleep = sleep14.slice(-7).filter((d) => d.y > 0)
  const avgSleep =
    weeklySleep.length === 0
      ? 0
      : weeklySleep.reduce((s, d) => s + d.y, 0) / weeklySleep.length

  const weeklyQuality = (() => {
    const since = todayISO()
    const last7 = sortedSleep.filter((s) => {
      const days = (new Date(since).getTime() - new Date(s.date).getTime()) / 86400000
      return days >= 0 && days < 7
    })
    if (last7.length === 0) return 0
    return last7.reduce((s, x) => s + x.quality, 0) / last7.length
  })()

  const lastWeight = sortedWeight[sortedWeight.length - 1]
  const firstWeight = sortedWeight[0]
  const weightDelta =
    lastWeight && firstWeight ? lastWeight.kg - firstWeight.kg : 0

  const weightProgress = (() => {
    if (!lastWeight || !weightGoal || !firstWeight) return 0
    if (firstWeight.kg === weightGoal) return 1
    const total = firstWeight.kg - weightGoal
    const done = firstWeight.kg - lastWeight.kg
    return Math.max(0, Math.min(1, done / total))
  })()

  function saveSleep(entry: SleepEntry) {
    store.setSleep((prev) => {
      const idx = prev.findIndex((x) => x.id === entry.id)
      if (idx === -1) return [...prev, entry]
      const copy = [...prev]
      copy[idx] = entry
      return copy
    })
  }
  function removeSleep(id: string) {
    store.setSleep((prev) => prev.filter((s) => s.id !== id))
  }
  function saveWeight(entry: WeightEntry) {
    store.setWeight((prev) => {
      const idx = prev.findIndex((x) => x.id === entry.id)
      if (idx === -1) return [...prev, entry]
      const copy = [...prev]
      copy[idx] = entry
      return copy
    })
  }
  function removeWeight(id: string) {
    store.setWeight((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <Card className="bg-accent/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-card text-primary flex size-10 items-center justify-center rounded-2xl">
              <HeartPulse className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle>Tu cuerpo es la base de todo lo demás.</CardTitle>
              <CardDescription className="mt-1">
                Dormir y mover el peso te dan energía para el resto.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => setGoalOpen(true)}>
              <Target />
              Metas
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Sleep section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Moon className="text-primary size-4" />
                Sueño
              </CardTitle>
              <CardDescription>
                Promedio de los últimos 7 días vs tu meta de {sleepGoal} h.
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingSleep(null)
                setSleepOpen(true)
              }}
            >
              <Plus />
              Registrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {store.sleep.length === 0 ? (
            <EmptyState
              icon={Moon}
              title="Sin registros de sueño"
              description="Registra cómo dormiste anoche. La tendencia importa más que un día suelto."
              action={
                <Button
                  onClick={() => {
                    setEditingSleep(null)
                    setSleepOpen(true)
                  }}
                >
                  <Plus />
                  Registrar primer sueño
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
              <div className="flex items-center justify-center gap-6 sm:flex-col">
                <RadialChart
                  value={Math.min(avgSleep / sleepGoal, 1)}
                  size={140}
                  thickness={12}
                  fgClassName="stroke-primary"
                >
                  <div className="flex flex-col items-center leading-none">
                    <span className="font-heading text-3xl font-semibold tabular-nums">
                      {avgSleep.toFixed(1)}
                    </span>
                    <span className="text-muted-foreground text-xs">h / noche</span>
                  </div>
                </RadialChart>
                <div className="flex flex-col items-center gap-1">
                  <RadialChart
                    value={weeklyQuality / 5}
                    size={64}
                    thickness={6}
                    fgClassName="stroke-emerald-400"
                  >
                    <span className="text-xs font-semibold tabular-nums">
                      {weeklyQuality.toFixed(1)}
                    </span>
                  </RadialChart>
                  <span className="text-muted-foreground text-[10px] uppercase tracking-wide">
                    calidad / 5
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <div className="text-muted-foreground mb-1 text-xs">
                    Últimas 14 noches
                  </div>
                  <Sparkline
                    data={sleep14}
                    height={80}
                    yMin={0}
                    yMax={Math.max(10, sleepGoal + 1)}
                    showDots
                    strokeClassName="stroke-primary"
                    fillClassName="fill-primary/15"
                  />
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">
                    Recientes
                  </div>
                  {sortedSleep
                    .slice(-5)
                    .reverse()
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setEditingSleep(s)
                          setSleepOpen(true)
                        }}
                        className="hover:bg-muted flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition-colors"
                      >
                        <span className="text-muted-foreground tabular-nums">
                          {s.date}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-medium tabular-nums">
                            {s.hours.toFixed(1)} h
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-muted text-muted-foreground border-transparent"
                          >
                            {s.quality}/5
                          </Badge>
                          <Pencil className="text-muted-foreground/40 size-3" />
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weight section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Scale className="text-primary size-4" />
                Peso
              </CardTitle>
              <CardDescription>
                {weightGoal
                  ? `Tendencia hacia tu meta de ${weightGoal} kg.`
                  : "Define una meta en el botón superior para ver progreso."}
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingWeight(null)
                setWeightOpen(true)
              }}
            >
              <Plus />
              Registrar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {store.weight.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Sin registros de peso"
              description="Pésate al despertar, una vez por semana basta. La línea es lo que cuenta."
              action={
                <Button
                  onClick={() => {
                    setEditingWeight(null)
                    setWeightOpen(true)
                  }}
                >
                  <Plus />
                  Registrar primer peso
                </Button>
              }
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
              <div className="flex items-center justify-center">
                <RadialChart
                  value={weightProgress}
                  size={140}
                  thickness={12}
                  fgClassName="stroke-emerald-400"
                >
                  <div className="flex flex-col items-center leading-none">
                    <span className="font-heading text-3xl font-semibold tabular-nums">
                      {lastWeight?.kg.toFixed(1) ?? "—"}
                    </span>
                    <span className="text-muted-foreground text-xs">kg actual</span>
                    {weightGoal && (
                      <span className="text-muted-foreground mt-2 text-[10px] uppercase tracking-wide">
                        meta {weightGoal}
                      </span>
                    )}
                  </div>
                </RadialChart>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className={
                      weightDelta < 0
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-transparent"
                        : weightDelta > 0
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-transparent"
                          : "bg-muted text-muted-foreground border-transparent"
                    }
                  >
                    {weightDelta < 0 ? (
                      <TrendingDown className="size-3" />
                    ) : weightDelta > 0 ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <Heart className="size-3" />
                    )}
                    {weightDelta === 0
                      ? "Estable"
                      : `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg`}
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    desde el primer registro
                  </span>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1 text-xs">Tendencia</div>
                  <Sparkline
                    data={sortedWeight.map((w) => ({ x: w.date, y: w.kg }))}
                    height={80}
                    showDots
                    strokeClassName="stroke-emerald-400"
                    fillClassName="fill-emerald-400/15"
                  />
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <div className="text-muted-foreground text-xs uppercase tracking-wide">
                    Recientes
                  </div>
                  {[...sortedWeight].reverse().slice(0, 5).map((w) => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setEditingWeight(w)
                        setWeightOpen(true)
                      }}
                      className="hover:bg-muted flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl px-2 py-1.5 text-left text-sm transition-colors"
                    >
                      <span className="text-muted-foreground tabular-nums">
                        {w.date}
                      </span>
                      <span className="flex items-center gap-2">
                        <span className="font-medium tabular-nums">
                          {w.kg.toFixed(1)} kg
                        </span>
                        <Pencil className="text-muted-foreground/40 size-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SleepDialog
        open={sleepOpen}
        onOpenChange={(v) => {
          setSleepOpen(v)
          if (!v) setEditingSleep(null)
        }}
        entry={editingSleep}
        onSave={saveSleep}
        onDelete={removeSleep}
      />
      <WeightDialog
        open={weightOpen}
        onOpenChange={(v) => {
          setWeightOpen(v)
          if (!v) setEditingWeight(null)
        }}
        entry={editingWeight}
        onSave={saveWeight}
        onDelete={removeWeight}
      />
      <HealthGoalDialog
        open={goalOpen}
        onOpenChange={setGoalOpen}
        goal={store.healthGoal}
        onSave={(g) => store.setHealthGoal(g)}
      />
    </div>
  )
}
