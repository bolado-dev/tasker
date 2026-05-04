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
import type { HealthGoal } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  goal: HealthGoal
  onSave: (g: HealthGoal) => void
}

export function HealthGoalDialog(props: Props) {
  const { open, onOpenChange } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <GoalForm key={String(open)} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function GoalForm({ onOpenChange, goal, onSave }: Props) {
  const [weight, setWeight] = React.useState<string>(
    goal.weightKg?.toString() ?? "",
  )
  const [sleep, setSleep] = React.useState<string>(
    goal.sleepHours?.toString() ?? "8",
  )

  function handleSave() {
    onSave({
      weightKg: weight ? Number(weight) : undefined,
      sleepHours: sleep ? Number(sleep) : undefined,
    })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tus metas</DialogTitle>
        <DialogDescription>
          No para juzgarte. Para que los gráficos sepan dónde apuntar.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="goal-weight">Peso objetivo (kg)</Label>
          <Input
            id="goal-weight"
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ej: 72"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="goal-sleep">Horas de sueño objetivo</Label>
          <Input
            id="goal-sleep"
            type="number"
            step="0.5"
            min="4"
            max="12"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSave}>Guardar</Button>
      </DialogFooter>
    </>
  )
}
