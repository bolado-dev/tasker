"use client"

import * as React from "react"
import { Check, Cloud, Copy, Sparkles } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"
import { CODE_PATTERN, generateCode } from "@/lib/sync"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  currentCode: string | null
  onApply: (code: string | null) => void
}

export function SpaceDialog(props: Props) {
  const { open, onOpenChange } = props
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open && <SpaceForm key={props.currentCode ?? "new"} {...props} />}
      </DialogContent>
    </Dialog>
  )
}

function SpaceForm({ onOpenChange, currentCode, onApply }: Props) {
  const [code, setCode] = React.useState(currentCode ?? "")
  const [copied, setCopied] = React.useState(false)
  const valid = code === "" || CODE_PATTERN.test(code)

  function regenerate() {
    setCode(generateCode())
  }

  async function copy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore
    }
  }

  function apply() {
    if (!valid) return
    onApply(code.trim() || null)
    onOpenChange(false)
  }

  function disconnect() {
    onApply(null)
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <div className="bg-primary/15 text-primary mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl">
          <Cloud className="size-6" />
        </div>
        <DialogTitle className="text-center">Sincroniza tu espacio</DialogTitle>
        <DialogDescription className="text-center">
          Usa el mismo código en todos tus dispositivos para tener tus tareas, proyectos
          y rachas en cualquier lado.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="space-code">Código de espacio</Label>
          <div className="flex gap-2">
            <Input
              id="space-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
              placeholder="Ej: t9k2m4ph"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copy}
              disabled={!code}
              aria-label="Copiar"
            >
              {copied ? <Check /> : <Copy />}
            </Button>
          </div>
          {!valid && (
            <p className="text-destructive text-xs">
              Solo letras, números y guiones (4–40 caracteres).
            </p>
          )}
          <p className="text-muted-foreground text-xs">
            Guárdalo bien: cualquiera con este código verá y editará tus datos.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={regenerate}>
          <Sparkles />
          Generar uno nuevo para mí
        </Button>

        <Separator />

        <div className="text-muted-foreground text-xs">
          {currentCode ? (
            <>
              Conectado a <span className="text-foreground font-mono">{currentCode}</span>.
              Cambiar el código reemplazará tus datos locales con los del nuevo espacio.
            </>
          ) : (
            <>Sin sincronizar. Tus datos viven solo en este dispositivo.</>
          )}
        </div>
      </div>

      <DialogFooter className="sm:justify-between">
        <div>
          {currentCode && (
            <Button variant="ghost" onClick={disconnect}>
              Desconectar
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={apply} disabled={!valid}>
            {currentCode ? "Aplicar" : "Conectar"}
          </Button>
        </div>
      </DialogFooter>
    </>
  )
}
