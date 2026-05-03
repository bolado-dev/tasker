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
import { Checkbox } from "@/components/ui/checkbox"
import type { Priority, Project, Repeat, Task } from "@/lib/types"
import { uid } from "@/lib/storage"

export type TaskDefaults = {
  dueDate?: string
  startTime?: string
  endTime?: string
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  task?: Task | null
  defaults?: TaskDefaults | null
  projects: Project[]
  onSave: (task: Task) => void
  onDelete?: (id: string) => void
}

export function TaskDialog(props: Props) {
  const { open, onOpenChange, task, defaults } = props
  const formKey =
    task?.id ?? `new-${defaults?.dueDate ?? ""}-${defaults?.startTime ?? ""}`
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <TaskForm key={formKey} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function TaskForm({
  onOpenChange,
  task,
  defaults,
  projects,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = React.useState(task?.title ?? "")
  const [notes, setNotes] = React.useState(task?.notes ?? "")
  const [priority, setPriority] = React.useState<Priority>(task?.priority ?? "med")
  const [projectId, setProjectId] = React.useState<string>(task?.projectId ?? "none")
  const [dueDate, setDueDate] = React.useState<string>(
    task?.dueDate ?? defaults?.dueDate ?? "",
  )
  const [repeat, setRepeat] = React.useState<Repeat>(task?.repeat ?? "none")
  const initialTimed = Boolean(
    task?.startTime || task?.endTime || defaults?.startTime,
  )
  const [timed, setTimed] = React.useState(initialTimed)
  const [startTime, setStartTime] = React.useState<string>(
    task?.startTime ?? defaults?.startTime ?? "09:00",
  )
  const [endTime, setEndTime] = React.useState<string>(
    task?.endTime ?? defaults?.endTime ?? "10:00",
  )

  function handleSave() {
    const t = title.trim()
    if (!t) return
    if (timed && startTime >= endTime) return
    const recur = repeat === "none" ? undefined : repeat
    const start = timed ? startTime : undefined
    const end = timed ? endTime : undefined
    const next: Task = task
      ? {
          ...task,
          title: t,
          notes: notes.trim() || undefined,
          priority,
          projectId: projectId === "none" ? undefined : projectId,
          dueDate: dueDate || undefined,
          startTime: start,
          endTime: end,
          repeat: recur,
        }
      : {
          id: uid(),
          title: t,
          notes: notes.trim() || undefined,
          priority,
          projectId: projectId === "none" ? undefined : projectId,
          dueDate: dueDate || undefined,
          startTime: start,
          endTime: end,
          done: false,
          repeat: recur,
          createdAt: Date.now(),
        }
    onSave(next)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        <DialogDescription>
          Algo concreto, hecho hoy, vale más que mil planes.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="task-title">Título</Label>
          <Input
            id="task-title"
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Salir a caminar 30 min"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-notes">Notas (opcional)</Label>
          <Textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Cómo, dónde, qué necesitas…"
            rows={3}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label>Prioridad</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="med">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            <Label htmlFor="task-due">Fecha</Label>
            <Input
              id="task-due"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-3">
          <label className="bg-muted/40 hover:bg-muted flex cursor-pointer items-center gap-3 rounded-2xl p-3 transition-colors">
            <Checkbox
              checked={timed}
              onCheckedChange={(v) => setTimed(v === true)}
              aria-label="Asignar a una hora"
            />
            <div className="flex-1">
              <div className="text-sm font-medium">Asignarla a una hora</div>
              <div className="text-muted-foreground text-xs">
                Aparecerá como bloque en el calendario del día.
              </div>
            </div>
          </label>
          {timed && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="task-start">Inicia</Label>
                <Input
                  id="task-start"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="task-end">Termina</Label>
                <Input
                  id="task-end"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
              {startTime >= endTime && (
                <p className="text-destructive col-span-full text-xs">
                  La hora de fin debe ser posterior al inicio.
                </p>
              )}
              {!dueDate && (
                <p className="text-destructive col-span-full text-xs">
                  Asigna una fecha para que se ubique en el calendario.
                </p>
              )}
            </div>
          )}
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
          {repeat !== "none" && !dueDate && (
            <p className="text-destructive text-xs">
              Asigna una fecha de inicio para que se pueda repetir.
            </p>
          )}
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <div>
          {task && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(task.id)
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
