"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Segment = {
  value: number
  className?: string
}

type Props = {
  /** 0-1 fraction. Ignored if `segments` is provided. */
  value?: number
  /** When provided, draws stacked arc segments summing up to <= 1. */
  segments?: Segment[]
  /** total used to compute fraction; if omitted defaults to 1 */
  max?: number
  /** Diameter in px */
  size?: number
  /** Stroke width relative to size; defaults to 10% */
  thickness?: number
  /** Track color (Tailwind class targeting stroke-) */
  trackClassName?: string
  /** Foreground stroke color class */
  fgClassName?: string
  className?: string
  children?: React.ReactNode
  /** Animate from 0 on mount */
  animated?: boolean
  /** Suffix shown when no children (e.g. "%") */
  unit?: string
}

export function RadialChart({
  value = 0,
  segments,
  max = 1,
  size = 120,
  thickness,
  trackClassName = "stroke-muted",
  fgClassName = "stroke-primary",
  className,
  children,
  animated = true,
  unit,
}: Props) {
  const stroke = thickness ?? Math.round(size * 0.1)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const fraction = segments
    ? Math.max(0, Math.min(1, segments.reduce((s, x) => s + x.value, 0) / max))
    : Math.max(0, Math.min(1, value / max))

  const [progress, setProgress] = React.useState(animated ? 0 : fraction)
  React.useEffect(() => {
    if (!animated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProgress(fraction)
      return
    }
    const id = window.requestAnimationFrame(() => setProgress(fraction))
    return () => window.cancelAnimationFrame(id)
  }, [fraction, animated])

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
          strokeLinecap="round"
        />
        {segments ? (
          (() => {
            let offset = 0
            return segments.map((seg, i) => {
              const segFrac = Math.max(
                0,
                Math.min(1, (seg.value / max) * progress) /
                  (fraction || 1) *
                  fraction,
              )
              const arcLen = c * segFrac
              const dasharray = `${arcLen} ${c - arcLen}`
              const dashoffset = -offset
              offset += arcLen
              return (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  className={cn("transition-all duration-700 ease-out", seg.className)}
                  strokeDasharray={dasharray}
                  strokeDashoffset={dashoffset}
                />
              )
            })
          })()
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            className={cn("transition-all duration-700 ease-out", fgClassName)}
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children ?? (
          <span className="font-heading text-xl font-semibold tabular-nums">
            {Math.round(fraction * 100)}
            {unit ?? "%"}
          </span>
        )}
      </div>
    </div>
  )
}
