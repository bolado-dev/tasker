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
import type { Priority, Project, Task } from "@/lib/types"
import { uid } from "@/lib/storage"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  task?: Task | null
  projects: Project[]
  onSave: (task: Task) => void
  onDelete?: (id: string) => void
}

export function TaskDialog(props: Props) {
  const { open, onOpenChange, task } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <TaskForm key={task?.id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function TaskForm({
  onOpenChange,
  task,
  projects,
  onSave,
  onDelete,
}: Props) {
  const [title, setTitle] = React.useState(task?.title ?? "")
  const [notes, setNotes] = React.useState(task?.notes ?? "")
  const [priority, setPriority] = React.useState<Priority>(task?.priority ?? "med")
  const [projectId, setProjectId] = React.useState<string>(task?.projectId ?? "none")
  const [dueDate, setDueDate] = React.useState<string>(task?.dueDate ?? "")

  function handleSave() {
    const t = title.trim()
    if (!t) return
    const next: Task = task
      ? {
          ...task,
          title: t,
          notes: notes.trim() || undefined,
          priority,
          projectId: projectId === "none" ? undefined : projectId,
          dueDate: dueDate || undefined,
        }
      : {
          id: uid(),
          title: t,
          notes: notes.trim() || undefined,
          priority,
          projectId: projectId === "none" ? undefined : projectId,
          dueDate: dueDate || undefined,
          done: false,
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
