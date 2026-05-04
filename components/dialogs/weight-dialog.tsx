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
import type { WeightEntry } from "@/lib/types"
import { uid } from "@/lib/storage"
import { todayISO } from "@/lib/format"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  entry?: WeightEntry | null
  onSave: (e: WeightEntry) => void
  onDelete?: (id: string) => void
}

export function WeightDialog(props: Props) {
  const { open, onOpenChange, entry } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <WeightForm key={entry?.id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function WeightForm({ onOpenChange, entry, onSave, onDelete }: Props) {
  const [date, setDate] = React.useState(entry?.date ?? todayISO())
  const [kg, setKg] = React.useState<string>(
    entry?.kg?.toString() ?? "",
  )
  const [notes, setNotes] = React.useState(entry?.notes ?? "")

  function handleSave() {
    const v = Number(kg)
    if (!v || v <= 0) return
    const next: WeightEntry = entry
      ? {
          ...entry,
          date,
          kg: v,
          notes: notes.trim() || undefined,
        }
      : {
          id: uid(),
          date,
          kg: v,
          notes: notes.trim() || undefined,
          createdAt: Date.now(),
        }
    onSave(next)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{entry ? "Editar peso" : "Registrar peso"}</DialogTitle>
        <DialogDescription>
          Pesarte sin obsesionarte. La tendencia importa más que el número del día.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="w-date">Día</Label>
            <Input
              id="w-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="w-kg">Peso (kg)</Label>
            <Input
              id="w-kg"
              type="number"
              step="0.1"
              min="20"
              max="300"
              value={kg}
              onChange={(e) => setKg(e.target.value)}
              placeholder="72.5"
              autoFocus
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="w-notes">Notas</Label>
          <Textarea
            id="w-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto: viaje, comida pesada, ayuno…"
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
