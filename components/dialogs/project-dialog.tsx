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
import { PROJECT_COLORS, type Project, type ProjectStatus } from "@/lib/types"
import { uid } from "@/lib/storage"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  project?: Project | null
  onSave: (project: Project) => void
  onDelete?: (id: string) => void
}

export function ProjectDialog(props: Props) {
  const { open, onOpenChange, project } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <ProjectForm key={project?.id ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function ProjectForm({
  onOpenChange,
  project,
  onSave,
  onDelete,
}: Props) {
  const [name, setName] = React.useState(project?.name ?? "")
  const [description, setDescription] = React.useState(project?.description ?? "")
  const [color, setColor] = React.useState<string>(
    project?.color ?? PROJECT_COLORS[0].name,
  )
  const [status, setStatus] = React.useState<ProjectStatus>(
    project?.status ?? "active",
  )

  function handleSave() {
    const n = name.trim()
    if (!n) return
    const next: Project = project
      ? {
          ...project,
          name: n,
          description: description.trim() || undefined,
          color,
          status,
        }
      : {
          id: uid(),
          name: n,
          description: description.trim() || undefined,
          color,
          status,
          createdAt: Date.now(),
        }
    onSave(next)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{project ? "Editar proyecto" : "Nuevo proyecto"}</DialogTitle>
        <DialogDescription>
          Un proyecto es algo en lo que vale la pena gastar tu tiempo.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="project-name">Nombre</Label>
          <Input
            id="project-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Aprender guitarra"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="project-desc">Descripción</Label>
          <Textarea
            id="project-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Por qué importa este proyecto…"
            rows={3}
          />
        </div>
        <div className="grid gap-2">
          <Label>Color</Label>
          <div className="flex flex-wrap gap-2">
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
        <div className="grid gap-2">
          <Label>Estado</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="paused">En pausa</SelectItem>
              <SelectItem value="done">Terminado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter className="sm:justify-between">
        <div>
          {project && onDelete && (
            <Button
              variant="destructive"
              onClick={() => {
                onDelete(project.id)
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
