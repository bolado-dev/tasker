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
import type { Reminder, ReminderRepeat } from "@/lib/types"
import { computeNextFireAt } from "@/lib/reminder"
import { todayISO } from "@/lib/format"
import { uid } from "@/lib/storage"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  reminder?: Reminder | null
  onSave: (r: Reminder) => void
  onDelete?: (id: string) => void
}

export function ReminderDialog(props: Props) {
  const { open, onOpenChange, reminder } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <ReminderForm key={reminder?.id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function ReminderForm({ onOpenChange, reminder, onSave, onDelete }: Props) {
  const [title, setTitle] = React.useState(reminder?.title ?? "")
  const [body, setBody] = React.useState(reminder?.body ?? "")
  const [time, setTime] = React.useState(reminder?.time ?? "09:00")
  const [repeat, setRepeat] = React.useState<ReminderRepeat>(
    reminder?.repeat ?? "daily",
  )
  const [date, setDate] = React.useState(reminder?.date ?? todayISO())
  const [weekday, setWeekday] = React.useState<number>(
    reminder?.weekday ?? new Date().getDay(),
  )

  function handleSave() {
    const t = title.trim()
    if (!t) return

    const draft = {
      time,
      repeat,
      date: repeat === "once" ? date : undefined,
      weekday: repeat === "weekly" ? weekday : undefined,
    }
    const nextFireAt = computeNextFireAt(draft)

    const next: Reminder = reminder
      ? {
          ...reminder,
          title: t,
          body: body.trim() || undefined,
          time,
          repeat,
          date: draft.date,
          weekday: draft.weekday,
          enabled: true,
          nextFireAt,
        }
      : {
          id: uid(),
          title: t,
          body: body.trim() || undefined,
          time,
          repeat,
          date: draft.date,
          weekday: draft.weekday,
          enabled: true,
          nextFireAt,
          createdAt: Date.now(),
        }

    onSave(next)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{reminder ? "Editar recordatorio" : "Nuevo recordatorio"}</DialogTitle>
        <DialogDescription>
          Te avisará aunque la app esté cerrada (con las notificaciones activadas).
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rem-title">Título</Label>
          <Input
            id="rem-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Tomar agua"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="rem-body">Mensaje (opcional)</Label>
          <Textarea
            id="rem-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Lo que quieres recordar al ver la notificación."
            rows={2}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="rem-time">Hora</Label>
            <Input
              id="rem-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label>Repetir</Label>
            <Select
              value={repeat}
              onValueChange={(v) => setRepeat(v as ReminderRepeat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Una sola vez</SelectItem>
                <SelectItem value="daily">Cada día</SelectItem>
                <SelectItem value="weekdays">Lunes a viernes</SelectItem>
                <SelectItem value="weekly">Una vez por semana</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {repeat === "once" && (
          <div className="grid gap-2">
            <Label htmlFor="rem-date">Fecha</Label>
            <Input
              id="rem-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        )}
        {repeat === "weekly" && (
          <div className="grid gap-2">
            <Label>Día de la semana</Label>
            <Select
              value={String(weekday)}
              onValueChange={(v) => setWeekday(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Lunes</SelectItem>
                <SelectItem value="2">Martes</SelectItem>
                <SelectItem value="3">Miércoles</SelectItem>
                <SelectItem value="4">Jueves</SelectItem>
                <SelectItem value="5">Viernes</SelectItem>
                <SelectItem value="6">Sábado</SelectItem>
                <SelectItem value="0">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <DialogFooter className="sm:justify-between">
        <div>
          {reminder && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(reminder.id)
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
