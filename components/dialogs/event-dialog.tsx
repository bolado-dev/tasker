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
import { PROJECT_COLORS, type Event, type Project, type Repeat } from "@/lib/types"
import { uid } from "@/lib/storage"
import { cn } from "@/lib/utils"

export type EventDefaults = {
  date: string
  startTime: string
  endTime: string
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  event?: Event | null
  instanceDate?: string | null
  defaults?: EventDefaults | null
  projects: Project[]
  onSave: (event: Event) => void
  onDelete?: (id: string) => void
  onSkipInstance?: (id: string, date: string) => void
}

export function EventDialog(props: Props) {
  const { open, onOpenChange, event, defaults } = props
  const formKey = event?.id ?? `new-${defaults?.date}-${defaults?.startTime}`
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <EventForm key={formKey} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function EventForm({
  onOpenChange,
  event,
  instanceDate,
  defaults,
  projects,
  onSave,
  onDelete,
  onSkipInstance,
}: Props) {
  const isNew = !event
  const [title, setTitle] = React.useState(event?.title ?? "")
  const [notes, setNotes] = React.useState(event?.notes ?? "")
  const [date, setDate] = React.useState(event?.date ?? defaults?.date ?? "")
  const [startTime, setStartTime] = React.useState(
    event?.startTime ?? defaults?.startTime ?? "09:00",
  )
  const [endTime, setEndTime] = React.useState(
    event?.endTime ?? defaults?.endTime ?? "10:00",
  )
  const [projectId, setProjectId] = React.useState<string>(
    event?.projectId ?? "none",
  )
  const [color, setColor] = React.useState<string>(event?.color ?? "")
  const [repeat, setRepeat] = React.useState<Repeat>(event?.repeat ?? "none")
  const isRecurring = !!event && (event.repeat ?? "none") !== "none"

  function handleSave() {
    const t = title.trim()
    if (!t) return
    if (startTime >= endTime) return

    const recur = repeat === "none" ? undefined : repeat
    const next: Event = event
      ? {
          ...event,
          title: t,
          notes: notes.trim() || undefined,
          date,
          startTime,
          endTime,
          projectId: projectId === "none" ? undefined : projectId,
          color: color || undefined,
          repeat: recur,
        }
      : {
          id: uid(),
          title: t,
          notes: notes.trim() || undefined,
          date,
          startTime,
          endTime,
          projectId: projectId === "none" ? undefined : projectId,
          color: color || undefined,
          repeat: recur,
          createdAt: Date.now(),
        }
    onSave(next)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isNew ? "Nuevo evento" : "Editar evento"}</DialogTitle>
        <DialogDescription>
          Bloquea tiempo para lo que importa. Si no lo agendas, no pasa.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="ev-title">Título</Label>
          <Input
            id="ev-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Trabajo profundo"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="ev-date">Día</Label>
            <Input
              id="ev-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ev-start">Inicia</Label>
            <Input
              id="ev-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ev-end">Termina</Label>
            <Input
              id="ev-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>
        {startTime >= endTime && (
          <p className="text-destructive text-xs">
            La hora de fin debe ser posterior al inicio.
          </p>
        )}
        <div className="grid gap-2">
          <Label htmlFor="ev-notes">Notas</Label>
          <Textarea
            id="ev-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles, link, contexto…"
            rows={2}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Proyecto</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin proyecto</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor("")}
                className={cn(
                  "size-7 rounded-full ring-2 transition-all",
                  "bg-muted",
                  color === ""
                    ? "ring-foreground scale-110"
                    : "ring-transparent hover:scale-105",
                )}
                aria-label="Por proyecto"
                title="Color del proyecto"
              />
              {PROJECT_COLORS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  className={cn(
                    "size-7 rounded-full ring-2 transition-all",
                    c.className,
                    color === c.name
                      ? "ring-foreground scale-110"
                      : "ring-transparent hover:scale-105",
                  )}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Repetir</Label>
          <Select value={repeat} onValueChange={(v) => setRepeat(v as Repeat)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No se repite</SelectItem>
              <SelectItem value="daily">Cada día</SelectItem>
              <SelectItem value="weekly">Cada semana (mismo día)</SelectItem>
            </SelectContent>
          </Select>
          {isRecurring && (
            <p className="text-muted-foreground text-xs">
              Editar este evento cambia toda la serie. Para saltar solo este día,
              usa &laquo;Saltar este día&raquo;.
            </p>
          )}
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {event && isRecurring && instanceDate && onSkipInstance && (
            <Button
              variant="outline"
              onClick={() => {
                onSkipInstance(event.id, instanceDate)
                onOpenChange(false)
              }}
            >
              Saltar este día
            </Button>
          )}
          {event && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(event.id)
                onOpenChange(false)
              }}
            >
              {isRecurring ? "Eliminar serie" : "Eliminar"}
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
