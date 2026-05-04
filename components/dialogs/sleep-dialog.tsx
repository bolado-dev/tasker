"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SleepEntry } from "@/lib/types"
import { uid } from "@/lib/storage"
import { todayISO } from "@/lib/format"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  entry?: SleepEntry | null
  onSave: (e: SleepEntry) => void
  onDelete?: (id: string) => void
}

export function SleepDialog(props: Props) {
  const { open, onOpenChange, entry } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <SleepForm key={entry?.id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function computeHours(bedtime: string, wakeTime: string) {
  if (!bedtime || !wakeTime) return 0
  const [bh, bm] = bedtime.split(":").map(Number)
  const [wh, wm] = wakeTime.split(":").map(Number)
  let mins = wh * 60 + wm - (bh * 60 + bm)
  if (mins < 0) mins += 24 * 60
  return Math.round((mins / 60) * 10) / 10
}

function SleepForm({ onOpenChange, entry, onSave, onDelete }: Props) {
  const [date, setDate] = React.useState(entry?.date ?? todayISO())
  const [bedtime, setBedtime] = React.useState(entry?.bedtime ?? "23:00")
  const [wakeTime, setWakeTime] = React.useState(entry?.wakeTime ?? "07:00")
  const [quality, setQuality] = React.useState<1 | 2 | 3 | 4 | 5>(
    entry?.quality ?? 3,
  )
  const [notes, setNotes] = React.useState(entry?.notes ?? "")
  const hours = computeHours(bedtime, wakeTime)

  function handleSave() {
    const next: SleepEntry = entry
      ? {
          ...entry,
          date,
          bedtime: bedtime || undefined,
          wakeTime: wakeTime || undefined,
          hours,
          quality,
          notes: notes.trim() || undefined,
        }
      : {
          id: uid(),
          date,
          bedtime: bedtime || undefined,
          wakeTime: wakeTime || undefined,
          hours,
          quality,
          notes: notes.trim() || undefined,
          // eslint-disable-next-line react-hooks/purity
          createdAt: Date.now(),
        }
    onSave(next)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{entry ? "Editar sueño" : "Registrar sueño"}</DialogTitle>
        <DialogDescription>
          Dormir bien es invertir tiempo. Marca cómo dormiste anoche.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="sleep-date">Día</Label>
          <Input
            id="sleep-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="sleep-bed">Me acosté</Label>
            <Input
              id="sleep-bed"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sleep-wake">Desperté</Label>
            <Input
              id="sleep-wake"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>
        </div>
        <div className="text-muted-foreground text-xs">
          Horas dormidas:{" "}
          <span className="text-foreground font-medium tabular-nums">
            {hours.toFixed(1)} h
          </span>
        </div>
        <div className="grid gap-2">
          <Label>Calidad</Label>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={cn(
                  "flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-2xl py-2 text-sm transition-all duration-150 hover:scale-105 active:scale-95",
                  quality === q
                    ? "bg-primary/15 text-primary ring-primary/30 ring-1"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <span className="text-lg">
                  {q === 1 ? "😩" : q === 2 ? "😕" : q === 3 ? "😐" : q === 4 ? "🙂" : "😊"}
                </span>
                <span className="text-[10px]">{q}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sleep-notes">Notas</Label>
          <Textarea
            id="sleep-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Algo a recordar de esta noche…"
          />
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <div>
          {entry && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(entry.id)
                onOpenChange(false)
              }}
            >
              Eliminar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </DialogFooter>
    </>
  )
}
