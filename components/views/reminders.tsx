"use client"

import * as React from "react"
import {
  Bell,
  BellOff,
  CircleAlert,
  CircleCheck,
  Pencil,
  Plus,
  Smartphone,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ReminderDialog } from "@/components/dialogs/reminder-dialog"
import { EmptyState } from "@/components/empty-state"
import type { Reminder } from "@/lib/types"
import type { Store } from "@/lib/store-types"
import {
  computeNextFireAt,
  describeRepeat,
  formatFireDate,
  formatNextFire,
  refreshReminder,
} from "@/lib/reminder"
import {
  notifyPermissionChange,
  notifySubscriptionChange,
  pushSupported,
  subscribePush,
  syncRemindersToServer,
  unsubscribePush,
  useIsSubscribed,
  useNotificationPermission,
} from "@/lib/push-client"
import { useLocalReminderScheduler } from "@/lib/local-notify"
import { useSpaceCode } from "@/lib/sync"

export function RemindersView({ store }: { store: Store }) {
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Reminder | null>(null)
  const [code] = useSpaceCode()
  const permission = useNotificationPermission()
  const subscribed = useIsSubscribed()
  const supported = pushSupported()

  // Local scheduler (works while tab is open)
  useLocalReminderScheduler({
    reminders: store.reminders,
    setReminders: store.setReminders,
    enabled: permission === "granted",
  })

  // Re-render every 30s for "in X min" labels
  const [, setTick] = React.useState(0)
  React.useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000)
    return () => window.clearInterval(id)
  }, [])

  // Push: keep server reminders in sync with local
  React.useEffect(() => {
    if (!subscribed) return
    syncRemindersToServer({
      reminders: store.reminders,
      spaceCode: code,
    }).catch(() => {})
  }, [store.reminders, subscribed, code])

  function save(r: Reminder) {
    store.setReminders((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id)
      if (idx === -1) return [...prev, r]
      const copy = [...prev]
      copy[idx] = r
      return copy
    })
  }

  function remove(id: string) {
    store.setReminders((prev) => prev.filter((r) => r.id !== id))
  }

  function toggleEnabled(r: Reminder) {
    store.setReminders((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? {
              ...x,
              enabled: !x.enabled,
              nextFireAt: !x.enabled ? computeNextFireAt(x) : 0,
            }
          : x,
      ),
    )
  }

  async function enablePush() {
    if (!supported) {
      toast.error("Tu navegador no soporta notificaciones push.")
      return
    }
    try {
      const perm = await Notification.requestPermission()
      notifyPermissionChange()
      if (perm !== "granted") {
        toast.error("Permiso denegado. Activa notificaciones en los ajustes del navegador.")
        return
      }
      // Reset all nextFireAt to a fresh schedule
      store.setReminders((prev) =>
        prev.map((r) => (r.enabled ? refreshReminder(r) : r)),
      )
      const sub = await subscribePush({
        reminders: store.reminders.map((r) =>
          r.enabled ? refreshReminder(r) : r,
        ),
        spaceCode: code,
      })
      notifySubscriptionChange()
      if (sub) {
        toast.success("Notificaciones activadas. Te avisaremos a tiempo.")
      } else {
        toast.error("No se pudo crear la suscripción de push.")
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error"
      toast.error(msg)
    }
  }

  async function disablePush() {
    try {
      await unsubscribePush()
      notifySubscriptionChange()
      toast.success("Notificaciones desactivadas en este dispositivo.")
    } catch {
      toast.error("No se pudo desactivar.")
    }
  }

  async function testNotification() {
    if (permission !== "granted") {
      toast.error("Activa primero las notificaciones.")
      return
    }
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      reg?.showNotification("Tasker — prueba", {
        body: "Si ves esto, las notificaciones funcionan.",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "test",
        data: { url: "/" },
      })
    } else {
      new Notification("Tasker — prueba", {
        body: "Si ves esto, las notificaciones funcionan.",
        icon: "/icon-192.png",
      })
    }
  }

  const sorted = [...store.reminders].sort((a, b) => {
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
    return (a.nextFireAt || Infinity) - (b.nextFireAt || Infinity)
  })

  return (
    <div className="space-y-6">
      <PermissionCard
        supported={supported}
        permission={permission}
        subscribed={subscribed}
        onEnable={enablePush}
        onDisable={disablePush}
        onTest={testNotification}
      />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-base font-semibold">Tus recordatorios</h2>
          <p className="text-muted-foreground text-xs">
            Suenan a la hora aunque tengas la app cerrada o el teléfono bloqueado.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          <Plus />
          Nuevo
        </Button>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Sin recordatorios"
          description="Crea uno para que algo te saque del piloto automático y te lleve donde quieres ir."
          action={
            <Button
              onClick={() => {
                setEditing(null)
                setOpen(true)
              }}
            >
              <Plus />
              Crear recordatorio
            </Button>
          }
        />
      ) : (
        <div className="animate-stagger grid gap-3 md:grid-cols-2">
          {sorted.map((r) => (
            <Card
              key={r.id}
              size="sm"
              className="lift-on-hover hover:shadow-[0_2px_4px_rgb(0_0_0/0.04),0_16px_36px_-12px_rgb(0_0_0/0.10)]"
            >
              <CardContent>
                <div className="flex items-start gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-2xl ${
                      r.enabled
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {r.enabled ? (
                      <Bell className="size-4" />
                    ) : (
                      <BellOff className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">{r.title}</div>
                        {r.body && (
                          <p className="text-muted-foreground line-clamp-2 text-xs">
                            {r.body}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditing(r)
                          setOpen(true)
                        }}
                        aria-label="Editar"
                      >
                        <Pencil />
                      </Button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <Badge
                        variant="outline"
                        className="bg-muted text-muted-foreground border-transparent"
                      >
                        {r.time} · {describeRepeat(r.repeat, r.weekday)}
                      </Badge>
                      {r.enabled && r.nextFireAt > 0 && (
                        <span className="text-muted-foreground">
                          {formatFireDate(r.nextFireAt)} ({formatNextFire(r.nextFireAt)})
                        </span>
                      )}
                      {!r.enabled && (
                        <span className="text-muted-foreground">Desactivado</span>
                      )}
                    </div>

                    <Separator className="my-3" />

                    <div className="flex items-center justify-between">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => toggleEnabled(r)}
                      >
                        {r.enabled ? "Pausar" : "Activar"}
                      </Button>
                      <span className="text-muted-foreground/60 font-mono text-[10px]">
                        {r.lastFiredAt
                          ? `último: ${new Date(r.lastFiredAt).toLocaleString("es", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}`
                          : "nunca disparado"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReminderDialog
        open={open}
        onOpenChange={setOpen}
        reminder={editing}
        onSave={save}
        onDelete={remove}
      />
    </div>
  )
}

function PermissionCard({
  supported,
  permission,
  subscribed,
  onEnable,
  onDisable,
  onTest,
}: {
  supported: boolean
  permission: "default" | "granted" | "denied" | "unsupported"
  subscribed: boolean
  onEnable: () => void
  onDisable: () => void
  onTest: () => void
}) {
  if (!supported) {
    return (
      <Card className="bg-accent/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-card text-muted-foreground flex size-10 items-center justify-center rounded-2xl">
              <CircleAlert className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle>Tu navegador no soporta notificaciones</CardTitle>
              <CardDescription className="mt-1">
                Para que los recordatorios suenen siempre, instala la app desde Chrome,
                Edge, Firefox o Safari (en iOS, &laquo;Añadir a pantalla de inicio&raquo;).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (permission === "denied") {
    return (
      <Card className="bg-accent/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-card text-destructive flex size-10 items-center justify-center rounded-2xl">
              <BellOff className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle>Notificaciones bloqueadas</CardTitle>
              <CardDescription className="mt-1">
                Activa los permisos desde el candado de la barra de direcciones (en
                móvil, Ajustes → Sitio). Luego vuelve aquí.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (permission !== "granted" || !subscribed) {
    return (
      <Card className="bg-accent/60">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-2xl">
              <Smartphone className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle>Activa las notificaciones</CardTitle>
              <CardDescription className="mt-1">
                Te avisaremos puntual incluso con la app cerrada o el teléfono
                bloqueado. En iOS, primero instala la app a la pantalla de inicio.
              </CardDescription>
            </div>
            <Button onClick={onEnable}>
              <Bell />
              Activar
            </Button>
          </div>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="bg-accent/60">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="bg-primary/15 text-primary flex size-10 items-center justify-center rounded-2xl">
            <CircleCheck className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <CardTitle>Notificaciones activadas en este dispositivo</CardTitle>
            <CardDescription className="mt-1">
              Recibirás cada recordatorio a la hora indicada. Puedes desactivarlas
              cuando quieras.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={onTest}>
              Probar
            </Button>
            <Button variant="ghost" onClick={onDisable}>
              Desactivar
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
