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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { Habit, HabitType } from "@/lib/types"
import { uid } from "@/lib/storage"
import { todayISO } from "@/lib/format"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  habit?: Habit | null
  onSave: (habit: Habit) => void
  onDelete?: (id: string) => void
}

export function HabitDialog(props: Props) {
  const { open, onOpenChange, habit } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <HabitForm key={habit?.id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function HabitForm({ onOpenChange, habit, onSave, onDelete }: Props) {
  const [name, setName] = React.useState(habit?.name ?? "")
  const [description, setDescription] = React.useState(habit?.description ?? "")
  const [type, setType] = React.useState<HabitType>(habit?.type ?? "quit")
  const [startDate, setStartDate] = React.useState(habit?.startDate ?? todayISO())

  function handleSave() {
    const n = name.trim()
    if (!n) return
    const next: Habit = habit
      ? {
          ...habit,
          name: n,
          description: description.trim() || undefined,
          type,
          startDate,
        }
      : {
          id: uid(),
          name: n,
          description: description.trim() || undefined,
          type,
          startDate,
          bestStreak: 0,
          totalRelapses: 0,
          createdAt: Date.now(),
        }
    onSave(next)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{habit ? "Editar hábito" : "Nuevo hábito"}</DialogTitle>
        <DialogDescription>
          Nombrar lo que quieres dejar (o construir) ya es la mitad del trabajo.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Tipo</Label>
          <Select value={type} onValueChange={(v) => setType(v as HabitType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quit">Dejar algo (adicción)</SelectItem>
              <SelectItem value="build">Construir un hábito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="habit-name">
            {type === "quit" ? "¿Qué quieres dejar?" : "¿Qué quieres construir?"}
          </Label>
          <Input
            id="habit-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === "quit"
                ? "Ej: Sin redes sociales sin propósito"
                : "Ej: Leer 20 min al día"
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="habit-desc">Por qué te importa</Label>
          <Textarea
            id="habit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Léelo cada vez que tengas ganas de recaer."
            rows={3}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="habit-start">Empieza el</Label>
          <Input
            id="habit-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <div>
          {habit && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(habit.id)
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
