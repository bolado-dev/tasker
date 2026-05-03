"use client"

import * as React from "react"
import { Clock, Plus, Sunrise } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { colorClass } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import { priorityClasses, todayISO } from "@/lib/format"
import { uid } from "@/lib/storage"

function timeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function TodayView({ store }: { store: Store }) {
  const today = todayISO()
  const tasksToday = store.tasks.filter((t) => t.dueDate === today)
  const [draft, setDraft] = React.useState("")

  const sortedRoutine = [...store.routine].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  )

  const minutes = nowMinutes()
  const currentBlock = sortedRoutine.find(
    (b) => timeToMinutes(b.startTime) <= minutes && timeToMinutes(b.endTime) > minutes,
  )

  function toggleTask(id: string) {
    store.setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: !t.done ? Date.now() : undefined }
          : t,
      ),
    )
  }

  function addQuickTask() {
    const title = draft.trim()
    if (!title) return
    store.setTasks((prev) => [
      ...prev,
      {
        id: uid(),
        title,
        done: false,
        priority: "med",
        dueDate: today,
        createdAt: Date.now(),
      },
    ])
    setDraft("")
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-6 lg:col-span-3">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tu rutina del día</CardTitle>
                <CardDescription>
                  Bloques de tiempo. Una estructura mata la ansiedad.
                </CardDescription>
              </div>
              {currentBlock && (
                <Badge variant="secondary" className="gap-1.5">
                  <span className="bg-primary size-1.5 animate-pulse rounded-full" />
                  Ahora: {currentBlock.label}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sortedRoutine.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                Tu rutina está vacía. Edítala desde Hábitos pronto.
              </p>
            ) : (
              <ol className="relative space-y-3 pl-6">
                <span className="bg-border absolute top-2 bottom-2 left-2 w-px" />
                {sortedRoutine.map((b) => {
                  const start = timeToMinutes(b.startTime)
                  const end = timeToMinutes(b.endTime)
                  const isNow = start <= minutes && end > minutes
                  const isPast = end <= minutes
                  return (
                    <li key={b.id} className="relative">
                      <span
                        className={`absolute -left-[1.2rem] top-3 size-3 rounded-full ring-4 ring-card ${
                          isNow
                            ? "bg-primary"
                            : isPast
                              ? "bg-muted-foreground/40"
                              : "bg-muted-foreground/60"
                        }`}
                      />
                      <div
                        className={`rounded-2xl border p-3 transition-colors ${
                          isNow ? "border-primary/30 bg-primary/5" : "border-border"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-2xl leading-none">{b.emoji ?? "⏱"}</div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium">{b.label}</span>
                              <span className="text-muted-foreground inline-flex items-center gap-1 text-xs tabular-nums">
                                <Clock className="size-3" />
                                {b.startTime} – {b.endTime}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              {b.activity}
                            </p>
                          </div>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sunrise className="text-primary size-4" />
              <CardTitle>Tareas de hoy</CardTitle>
            </div>
            <CardDescription>Lo concreto. Marca cuando lo logres.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                addQuickTask()
              }}
              className="mb-4 flex gap-2"
            >
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Agregar tarea rápida…"
              />
              <Button type="submit" size="icon" aria-label="Agregar">
                <Plus />
              </Button>
            </form>

            {tasksToday.length === 0 ? (
              <p className="text-muted-foreground py-4 text-center text-sm">
                Sin tareas para hoy. Agrega una arriba.
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {tasksToday.map((t) => {
                  const project = store.projects.find((p) => p.id === t.projectId)
                  return (
                    <li key={t.id} className="flex items-start gap-3 py-2.5">
                      <Checkbox
                        className="mt-0.5"
                        checked={t.done}
                        onCheckedChange={() => toggleTask(t.id)}
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
                        <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-2 text-xs">
                          {project && (
                            <span className="inline-flex items-center gap-1">
                              <span
                                className={`size-1.5 rounded-full ${colorClass(project.color)}`}
                              />
                              {project.name}
                            </span>
                          )}
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
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            <Separator className="my-4" />
            <div className="text-muted-foreground text-xs">
              {tasksToday.filter((t) => t.done).length} de {tasksToday.length} hechas hoy.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
