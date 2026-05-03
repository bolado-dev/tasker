"use client"

import * as React from "react"
import type { Reminder } from "./types"

export type PushPermission = "default" | "granted" | "denied" | "unsupported"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSupported() {
  if (typeof window === "undefined") return false
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  )
}

export async function ensureRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null
  let reg = await navigator.serviceWorker.getRegistration()
  if (!reg) {
    try {
      reg = await navigator.serviceWorker.register("/sw.js")
    } catch {
      return null
    }
  }
  await navigator.serviceWorker.ready
  return reg
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  const reg = await ensureRegistration()
  if (!reg) return null
  return await reg.pushManager.getSubscription()
}

export async function subscribePush(args: {
  reminders: Reminder[]
  spaceCode: string | null
}): Promise<PushSubscription | null> {
  if (!pushSupported()) return null
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!publicKey) throw new Error("Falta NEXT_PUBLIC_VAPID_PUBLIC_KEY")

  const reg = await ensureRegistration()
  if (!reg) throw new Error("Service worker no disponible")

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  const json = sub.toJSON()
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subscription: json,
      reminders: args.reminders,
      spaceCode: args.spaceCode,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
    }),
  })
  if (!res.ok) {
    throw new Error(`No se pudo guardar la suscripción (HTTP ${res.status})`)
  }
  return sub
}

export async function unsubscribePush() {
  const sub = await getCurrentSubscription()
  if (!sub) return
  const endpoint = sub.endpoint
  await sub.unsubscribe()
  await fetch("/api/push/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {})
}

export async function syncRemindersToServer(args: {
  reminders: Reminder[]
  spaceCode: string | null
}) {
  const sub = await getCurrentSubscription()
  if (!sub) return false
  const res = await fetch("/api/push/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: sub.endpoint,
      reminders: args.reminders,
      spaceCode: args.spaceCode,
    }),
  })
  return res.ok
}

const permListeners = new Set<() => void>()
function permSubscribe(cb: () => void) {
  permListeners.add(cb)
  return () => {
    permListeners.delete(cb)
  }
}
export function notifyPermissionChange() {
  permListeners.forEach((l) => l())
}

function readPermission(): PushPermission {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported"
  }
  return Notification.permission
}

export function useNotificationPermission(): PushPermission {
  return React.useSyncExternalStore(
    permSubscribe,
    readPermission,
    () => "default" as const,
  )
}

const subListeners = new Set<() => void>()
function subSubscribe(cb: () => void) {
  subListeners.add(cb)
  return () => {
    subListeners.delete(cb)
  }
}
export function notifySubscriptionChange() {
  subListeners.forEach((l) => l())
}

export function useIsSubscribed(): boolean {
  const [subscribed, setSubscribed] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function refresh() {
      const s = await getCurrentSubscription()
      if (!cancelled) setSubscribed(!!s)
    }
    refresh()
    const unsub = subSubscribe(refresh)
    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  return subscribed
}
