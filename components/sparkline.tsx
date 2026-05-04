"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Props = {
  data: { x: string; y: number }[]
  width?: number
  height?: number
  className?: string
  strokeClassName?: string
  fillClassName?: string
  showDots?: boolean
  yMin?: number
  yMax?: number
}

export function Sparkline({
  data,
  width = 320,
  height = 80,
  className,
  strokeClassName = "stroke-primary",
  fillClassName = "fill-primary/15",
  showDots = false,
  yMin,
  yMax,
}: Props) {
  if (data.length === 0) {
    return (
      <div
        className={cn(
          "text-muted-foreground/60 flex items-center justify-center text-xs",
          className,
        )}
        style={{ width: "100%", height }}
      >
        Sin datos todavía
      </div>
    )
  }

  const minY = yMin ?? Math.min(...data.map((d) => d.y))
  const maxY = yMax ?? Math.max(...data.map((d) => d.y))
  const range = maxY - minY || 1
  const padding = 6

  const usableW = width - padding * 2
  const usableH = height - padding * 2

  const points = data.map((d, i) => {
    const px = data.length === 1 ? width / 2 : padding + (i / (data.length - 1)) * usableW
    const py = padding + usableH - ((d.y - minY) / range) * usableH
    return { px, py, label: d.x, value: d.y }
  })

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.px.toFixed(2)} ${p.py.toFixed(2)}`)
    .join(" ")

  const areaD =
    points.length > 1
      ? `${pathD} L ${points[points.length - 1].px.toFixed(2)} ${height - padding} L ${points[0].px.toFixed(2)} ${height - padding} Z`
      : ""

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("block w-full", className)}
      style={{ height }}
      aria-hidden
    >
      {areaD && <path d={areaD} className={fillClassName} />}
      <path
        d={pathD}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn("transition-all duration-500 ease-out", strokeClassName)}
      />
      {showDots &&
        points.map((p, i) => (
          <circle
            key={i}
            cx={p.px}
            cy={p.py}
            r={2.5}
            className={cn("fill-primary", strokeClassName)}
          />
        ))}
    </svg>
  )
}
