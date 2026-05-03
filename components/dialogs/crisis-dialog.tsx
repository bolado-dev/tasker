"use client"

import * as React from "react"
import { LifeBuoy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const ACTIONS = [
  "Sal de la habitación. Camina 10 minutos. Sin teléfono.",
  "Bebe un vaso grande de agua, lento.",
  "Haz 20 flexiones o sentadillas. Que el cuerpo gane.",
  "Llama o escribe a alguien que te quiere bien.",
  "Date una ducha fría 60 segundos.",
  "Escribe en una hoja qué sientes. No la juzgues.",
  "Respira: 4 segundos inhala, 7 retén, 8 exhala. Diez veces.",
]

export function CrisisDialog() {
  const [open, setOpen] = React.useState(false)
  const [idx, setIdx] = React.useState(0)

  function next() {
    setIdx((i) => (i + 1) % ACTIONS.length)
  }

  function handleOpenChange(v: boolean) {
    if (v) setIdx(Math.floor(Math.random() * ACTIONS.length))
    setOpen(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <LifeBuoy />
          Crisis
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Una sola cosa, ahora.</DialogTitle>
          <DialogDescription>
            La urgencia pasa en 15 minutos si no la alimentas. Haz esto:
          </DialogDescription>
        </DialogHeader>
        <div className="bg-muted text-foreground rounded-2xl p-5 text-base font-medium">
          {ACTIONS[idx]}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={next}>
            Otra cosa
          </Button>
          <Button onClick={() => setOpen(false)}>Lo hago ahora</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
