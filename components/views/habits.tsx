"use client"

import * as React from "react"
import { Flame, Pencil, Plus, RotateCcw, Sparkles, TrendingUp } from "lucide-react"

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CrisisDialog } from "@/components/dialogs/crisis-dialog"
import { HabitDialog } from "@/components/dialogs/habit-dialog"
import type { Habit } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { daysSince, todayISO } from "@/lib/format"

const MILESTONES = [1, 3, 7, 14, 30, 60, 90, 180, 365]

function nextMilestone(days: number) {
  return MILESTONES.find((m) => m > days) ?? days + 30
}

function prevMilestone(days: number) {
  return [...MILESTONES].reverse().find((m) => m <= days) ?? 0
}

export function HabitsView({ store }: { store: Store }) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Habit | null>(null)
  const [relapsing, setRelapsing] = React.useState<Habit | null>(null)

  function save(h: Habit) {
    store.setHabits((prev) => {
      const idx = prev.findIndex((x) => x.id === h.id)
      if (idx === -1) return [...prev, h]
      const copy = [...prev]
      copy[idx] = h
      return copy
    })
  }

  function remove(id: string) {
    store.setHabits((prev) => prev.filter((h) => h.id !== id))
  }

  function confirmRelapse() {
    if (!relapsing) return
    const current = daysSince(relapsing.startDate)
    store.setHabits((prev) =>
      prev.map((h) =>
        h.id === relapsing.id
          ? {
              ...h,
              startDate: todayISO(),
              bestStreak: Math.max(h.bestStreak, current),
              totalRelapses: h.totalRelapses + 1,
            }
          : h,
      ),
    )
    setRelapsing(null)
  }

  return (
    <div className="space-y-6">
      <Card className="from-orange-500/10 to-rose-500/5 ring-orange-500/20 bg-gradient-to-br">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-orange-500/15 text-orange-500 flex size-10 items-center justify-center rounded-2xl">
              <Sparkles className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle>Cada día limpio se cuenta dos veces.</CardTitle>
              <CardDescription className="mt-1">
                Una vez en tu racha, otra en quien te estás convirtiendo.
              </CardDescription>
            </div>
            <CrisisDialog />
          </div>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold">Tus hábitos</h2>
          <p className="text-muted-foreground text-xs">
            Toca el hábito para editarlo. Si recaes, no es el fin — solo es día 0 otra vez.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus />
          Nuevo hábito
        </Button>
      </div>

      {store.habits.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground py-10 text-center text-sm">
              No tienes hábitos aún. Crea el primero — el más importante.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {store.habits.map((h) => {
            const days = daysSince(h.startDate)
            const next = nextMilestone(days)
            const prev = prevMilestone(days)
            const span = Math.max(1, next - prev)
            const pct = ((days - prev) / span) * 100
            return (
              <Card key={h.id} size="default">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            h.type === "quit"
                              ? "border-orange-500/30 text-orange-500"
                              : "border-emerald-500/30 text-emerald-500"
                          }
                        >
                          {h.type === "quit" ? "Dejar" : "Construir"}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2 truncate">{h.name}</CardTitle>
                      {h.description && (
                        <CardDescription className="line-clamp-2">
                          {h.description}
                        </CardDescription>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditing(h)
                        setOpen(true)
                      }}
                      aria-label="Editar"
                    >
                      <Pencil />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted flex items-center gap-4 rounded-2xl p-4">
                    <div className="bg-background flex size-14 shrink-0 items-center justify-center rounded-2xl shadow-sm">
                      <Flame className="size-6 text-orange-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-heading text-3xl font-semibold tabular-nums">
                          {days}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {days === 1 ? "día" : "días"}
                        </span>
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Desde {h.startDate}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-muted-foreground mb-1.5 flex justify-between text-xs">
                      <span>Próxima meta</span>
                      <span className="tabular-nums">
                        {days} / {next} días
                      </span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground inline-flex items-center gap-1.5">
                      <TrendingUp className="size-3" />
                      Mejor racha:{" "}
                      <strong className="text-foreground tabular-nums">
                        {Math.max(h.bestStreak, days)} d
                      </strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground"
                      onClick={() => setRelapsing(h)}
                    >
                      <RotateCcw />
                      Recaí
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <HabitDialog
        open={open}
        onOpenChange={setOpen}
        habit={editing}
        onSave={save}
        onDelete={remove}
      />

      <Dialog
        open={!!relapsing}
        onOpenChange={(v) => !v && setRelapsing(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Volver a empezar</DialogTitle>
            <DialogDescription>
              Recaer no borra los días que llevabas — son experiencia. Tu mejor racha se
              guarda. ¿Reiniciamos el contador a hoy?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRelapsing(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmRelapse}>Sí, reiniciar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
