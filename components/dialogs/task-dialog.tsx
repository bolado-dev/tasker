"use client"

import * as React from "react"
import { GripVertical, Plus, Trash2 } from "lucide-react"

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
import type { Priority, Project, Repeat, Subtask, Task } from "@/lib/types"
import { uid } from "@/lib/storage"
import { cn } from "@/lib/utils"

export type TaskDefaults = {
  dueDate?: string
  startTime?: string
  endTime?: string
  projectId?: string
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
    task?.id ?? `new-${defaults?.dueDate ?? ""}-${defaults?.startTime ?? ""}-${defaults?.projectId ?? ""}`
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92svh] w-[calc(100vw-2rem)] flex-col gap-0 p-0 sm:max-w-lg">
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
  const [projectId, setProjectId] = React.useState<string>(
    task?.projectId ?? defaults?.projectId ?? "none",
  )
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
  const [subtasks, setSubtasks] = React.useState<Subtask[]>(task?.subtasks ?? [])
  const [draftSub, setDraftSub] = React.useState("")
  const subInputRef = React.useRef<HTMLInputElement | null>(null)

  function addSub() {
    const t = draftSub.trim()
    if (!t) return
    setSubtasks((prev) => [...prev, { id: uid(), title: t, done: false }])
    setDraftSub("")
    requestAnimationFrame(() => subInputRef.current?.focus())
  }

  function toggleSub(id: string) {
    setSubtasks((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s)),
    )
  }

  function removeSub(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
  }

  function updateSubTitle(id: string, value: string) {
    setSubtasks((prev) => prev.map((s) => (s.id === id ? { ...s, title: value } : s)))
  }

  const subDone = subtasks.filter((s) => s.done).length

  function handleSave() {
    const t = title.trim()
    if (!t) return
    if (timed && startTime >= endTime) return
    const recur = repeat === "none" ? undefined : repeat
    const start = timed ? startTime : undefined
    const end = timed ? endTime : undefined
    const cleanSubs = subtasks
      .map((s) => ({ ...s, title: s.title.trim() }))
      .filter((s) => s.title)
    const allSubsDone = cleanSubs.length > 0 && cleanSubs.every((s) => s.done)
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
          subtasks: cleanSubs.length > 0 ? cleanSubs : undefined,
          done: allSubsDone ? true : task.done,
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
          done: allSubsDone,
          repeat: recur,
          subtasks: cleanSubs.length > 0 ? cleanSubs : undefined,
          createdAt: Date.now(),
        }
    onSave(next)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle>{task ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
        <DialogDescription>
          Algo concreto, hecho hoy, vale más que mil planes.
        </DialogDescription>
      </DialogHeader>

      <div className="flex-1 overflow-y-auto px-6 py-4">
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
              rows={2}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label>Prioridad</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger className="w-full">
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
                <SelectTrigger className="w-full">
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
            <label className="bg-muted/40 hover:bg-muted flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors">
              <Checkbox
                checked={timed}
                onCheckedChange={(v) => setTimed(v === true)}
                aria-label="Asignar a una hora"
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">Asignarla a una hora</div>
                <div className="text-muted-foreground text-xs">
                  Aparecerá como bloque en el calendario.
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
              <SelectTrigger className="w-full">
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

          <div className="grid gap-2">
            <div className="flex items-baseline justify-between">
              <Label>Subtareas</Label>
              {subtasks.length > 0 && (
                <span className="text-muted-foreground text-xs tabular-nums">
                  {subDone} / {subtasks.length}
                </span>
              )}
            </div>
            {subtasks.length > 0 && (
              <ul className="space-y-1.5">
                {subtasks.map((s) => (
                  <li
                    key={s.id}
                    className={cn(
                      "group/sub bg-muted/40 hover:bg-muted flex items-center gap-2 rounded-md border p-2 transition-colors",
                      s.done && "opacity-60",
                    )}
                  >
                    <GripVertical className="text-muted-foreground/30 size-3 shrink-0" />
                    <Checkbox
                      checked={s.done}
                      onCheckedChange={() => toggleSub(s.id)}
                      aria-label={s.title}
                    />
                    <Input
                      value={s.title}
                      onChange={(e) => updateSubTitle(s.id, e.target.value)}
                      className={cn(
                        "h-7 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0",
                        s.done && "line-through",
                      )}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeSub(s.id)}
                      aria-label="Quitar"
                      className="text-muted-foreground/60 opacity-0 transition-opacity group-hover/sub:opacity-100 group-focus-within/sub:opacity-100"
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input
                ref={subInputRef}
                value={draftSub}
                onChange={(e) => setDraftSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addSub()
                  }
                }}
                placeholder="Añadir subtarea…"
                className="h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addSub}
                disabled={!draftSub.trim()}
                aria-label="Añadir"
              >
                <Plus />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="bg-background flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-between">
        <div className="flex w-full sm:w-auto">
          {task && onDelete && (
            <Button
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={() => {
                onDelete(task.id)
                onOpenChange(false)
              }}
            >
              Eliminar
            </Button>
          )}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button className="flex-1 sm:flex-none" onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
