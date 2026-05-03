"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { colorClass, type Project } from "@/lib/types"
import { cn } from "@/lib/utils"

export const HOUR_HEIGHT = 56
const SNAP_MIN = 15
const TOTAL_HEIGHT = 24 * HOUR_HEIGHT

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function minToTime(min: number): string {
  const clamped = Math.max(0, Math.min(24 * 60, min))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  if (h === 24) return "23:59"
  return `${pad(h)}:${pad(m)}`
}

function minToY(min: number) {
  return (min / 60) * HOUR_HEIGHT
}

function snap(min: number) {
  return Math.round(min / SNAP_MIN) * SNAP_MIN
}

export type TimelineItemBase = {
  id: string
  instanceDate: string
  title: string
  startTime: string
  endTime: string
  notes?: string
  projectId?: string
  color?: string
}

export type TimelineEventItem = TimelineItemBase & { kind: "event" }
export type TimelineTaskItem = TimelineItemBase & { kind: "task"; done: boolean }
export type TimelineItem = TimelineEventItem | TimelineTaskItem

type Positioned = TimelineItem & {
  startMin: number
  endMin: number
  col: number
  cols: number
}

function layoutItems(items: TimelineItem[]): Positioned[] {
  const positioned: Positioned[] = items
    .map((it) => ({
      ...it,
      startMin: timeToMin(it.startTime),
      endMin: Math.max(timeToMin(it.endTime), timeToMin(it.startTime) + 15),
      col: 0,
      cols: 1,
    }))
    .sort(
      (a, b) =>
        a.startMin - b.startMin || b.endMin - b.startMin - (a.endMin - a.startMin),
    )

  const overlaps = (a: Positioned, b: Positioned) =>
    a.startMin < b.endMin && b.startMin < a.endMin

  const clusters: Positioned[][] = []
  for (const item of positioned) {
    let target: Positioned[] | undefined
    for (const c of clusters) {
      if (c.some((other) => overlaps(item, other))) {
        target = c
        break
      }
    }
    if (target) target.push(item)
    else clusters.push([item])
  }

  for (const c of clusters) {
    const tracks: number[] = []
    for (const ev of c) {
      let assigned = -1
      for (let t = 0; t < tracks.length; t++) {
        if (tracks[t] <= ev.startMin) {
          tracks[t] = ev.endMin
          assigned = t
          break
        }
      }
      if (assigned === -1) {
        tracks.push(ev.endMin)
        assigned = tracks.length - 1
      }
      ev.col = assigned
    }
    const totalCols = tracks.length
    for (const ev of c) ev.cols = totalCols
  }

  return positioned
}

type Props = {
  items: TimelineItem[]
  projects: Project[]
  date: string
  onSelect: (item: TimelineItem) => void
  onToggleTask?: (item: TimelineTaskItem) => void
  onCreate: (range: { startTime: string; endTime: string }) => void
  isToday: boolean
}

export function TimelineGrid({
  items,
  projects,
  onSelect,
  onToggleTask,
  onCreate,
  isToday,
}: Props) {
  const gridRef = React.useRef<HTMLDivElement | null>(null)
  const [dragRange, setDragRange] = React.useState<{
    startMin: number
    endMin: number
  } | null>(null)
  const dragStateRef = React.useRef<{
    pointerId: number
    anchor: number
  } | null>(null)

  const positioned = React.useMemo(() => layoutItems(items), [items])

  const [nowMin, setNowMin] = React.useState(() => {
    const d = new Date()
    return d.getHours() * 60 + d.getMinutes()
  })
  React.useEffect(() => {
    const id = window.setInterval(() => {
      const d = new Date()
      setNowMin(d.getHours() * 60 + d.getMinutes())
    }, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const scrolledRef = React.useRef(false)
  React.useEffect(() => {
    if (scrolledRef.current) return
    const container = gridRef.current?.parentElement
    if (!container) return
    const target = isToday
      ? Math.max(0, nowMin - 60)
      : positioned[0]?.startMin
        ? Math.max(0, positioned[0].startMin - 60)
        : 8 * 60
    container.scrollTop = (target / 60) * HOUR_HEIGHT
    scrolledRef.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pxToMin(clientY: number) {
    const grid = gridRef.current
    if (!grid) return 0
    const rect = grid.getBoundingClientRect()
    const y = clientY - rect.top
    const min = (y / HOUR_HEIGHT) * 60
    return Math.max(0, Math.min(24 * 60 - SNAP_MIN, snap(min)))
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("[data-event]")) return
    if (e.button !== 0 && e.pointerType === "mouse") return
    const m = pxToMin(e.clientY)
    dragStateRef.current = { pointerId: e.pointerId, anchor: m }
    setDragRange({ startMin: m, endMin: m + SNAP_MIN * 2 })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current
    if (!state || state.pointerId !== e.pointerId) return
    const m = pxToMin(e.clientY)
    const start = Math.min(state.anchor, m)
    const end = Math.max(state.anchor + SNAP_MIN, m + SNAP_MIN)
    setDragRange({ startMin: start, endMin: end })
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current
    if (!state || state.pointerId !== e.pointerId) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const range = dragRange
    dragStateRef.current = null
    setDragRange(null)
    if (!range) return
    onCreate({
      startTime: minToTime(range.startMin),
      endTime: minToTime(range.endMin),
    })
  }

  function handlePointerCancel() {
    dragStateRef.current = null
    setDragRange(null)
  }

  return (
    <div className="bg-card relative max-h-[calc(100svh-13rem)] overflow-y-auto rounded-3xl shadow-[0_1px_2px_rgb(0_0_0/0.02),0_8px_24px_-12px_rgb(0_0_0/0.06)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.3),0_10px_30px_-14px_rgb(0_0_0/0.4)]">
      <div className="relative flex">
        <div
          className="text-muted-foreground bg-card sticky left-0 z-10 w-14 shrink-0 select-none text-[10px] tabular-nums sm:w-16"
          style={{ height: TOTAL_HEIGHT }}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="relative flex justify-end pr-2"
              style={{ height: HOUR_HEIGHT }}
            >
              {h > 0 && <span className="-mt-1.5">{pad(h)}:00</span>}
            </div>
          ))}
        </div>

        <div
          ref={gridRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="relative flex-1 cursor-crosshair touch-none"
          style={{ height: TOTAL_HEIGHT }}
        >
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={h}
              className="border-foreground/5 absolute right-0 left-0 border-t"
              style={{ top: h * HOUR_HEIGHT }}
            />
          ))}
          {Array.from({ length: 24 }, (_, h) => (
            <div
              key={`h-${h}`}
              className="border-foreground/[0.025] absolute right-0 left-0 border-t border-dashed"
              style={{ top: h * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
            />
          ))}

          {dragRange && (
            <div
              className="bg-primary/15 ring-primary/30 pointer-events-none absolute right-1 left-1 rounded-xl ring-1"
              style={{
                top: minToY(dragRange.startMin),
                height: Math.max(
                  HOUR_HEIGHT / 2,
                  minToY(dragRange.endMin) - minToY(dragRange.startMin),
                ),
              }}
            >
              <div className="text-primary/90 px-2 pt-1 text-[10px] font-medium tabular-nums">
                {minToTime(dragRange.startMin)} – {minToTime(dragRange.endMin)}
              </div>
            </div>
          )}

          {positioned.map((it) => {
            const top = minToY(it.startMin)
            const height = Math.max(
              HOUR_HEIGHT / 4,
              minToY(it.endMin) - minToY(it.startMin),
            )
            const project = projects.find((p) => p.id === it.projectId)
            const swatch = it.color || project?.color || "mint"
            const widthPct = 100 / it.cols
            const leftPct = it.col * widthPct

            const isTask = it.kind === "task"
            const taskDone = isTask && (it as TimelineTaskItem).done

            return (
              <div
                key={`${it.kind}::${it.id}::${it.instanceDate}`}
                data-event
                className={cn(
                  "group/event absolute overflow-hidden rounded-xl transition-colors",
                  "shadow-[0_1px_2px_rgb(0_0_0/0.05)]",
                  isTask
                    ? cn(
                        "ring-foreground/10 bg-card ring-1 ring-inset",
                        taskDone && "opacity-60",
                      )
                    : colorClass(swatch),
                )}
                style={{
                  top,
                  height,
                  left: `calc(${leftPct}% + 4px)`,
                  width: `calc(${widthPct}% - 8px)`,
                }}
              >
                {/* Task accent stripe */}
                {isTask && (
                  <div
                    className={cn(
                      "absolute top-0 bottom-0 left-0 w-1",
                      colorClass(swatch),
                    )}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onSelect(it)}
                  className="absolute inset-0 flex flex-col items-stretch px-2 py-1 text-left"
                >
                  <div className="flex min-w-0 items-start gap-1.5">
                    {isTask && onToggleTask && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleTask(it as TimelineTaskItem)
                        }}
                        aria-label={taskDone ? "Marcar pendiente" : "Marcar hecha"}
                        className={cn(
                          "mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-[5px] transition-colors",
                          taskDone
                            ? "bg-foreground/80 text-background"
                            : "ring-foreground/30 hover:ring-foreground/60 ring-1 ring-inset",
                        )}
                      >
                        {taskDone && <Check className="size-2.5" strokeWidth={3} />}
                      </button>
                    )}
                    <div
                      className={cn(
                        "min-w-0 flex-1 truncate text-xs leading-tight",
                        isTask ? "font-medium" : "font-medium",
                        taskDone && "line-through",
                        isTask ? "text-foreground" : "text-foreground/90",
                      )}
                    >
                      {it.title}
                    </div>
                  </div>
                  {height > 28 && (
                    <div className="text-foreground/55 mt-0.5 truncate text-[10px] tabular-nums">
                      {it.startTime}–{it.endTime}
                    </div>
                  )}
                  {height > 64 && it.notes && (
                    <div className="text-foreground/55 mt-1 line-clamp-2 text-[10px] leading-tight">
                      {it.notes}
                    </div>
                  )}
                </button>
              </div>
            )
          })}

          {positioned.length === 0 && (
            <div className="text-muted-foreground/60 pointer-events-none absolute inset-0 flex items-center justify-center text-xs">
              <span className="bg-card/80 rounded-full px-3 py-1 backdrop-blur">
                Arrastra en cualquier hora para crear
              </span>
            </div>
          )}

          {isToday && (
            <div
              className="pointer-events-none absolute right-0 left-0 z-20"
              style={{ top: minToY(nowMin) }}
            >
              <div className="bg-primary absolute -left-1.5 size-3 -translate-y-1/2 rounded-full shadow-sm" />
              <div className="bg-primary h-px w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
