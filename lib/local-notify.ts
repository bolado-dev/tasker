"use client"

import * as React from "react"
import type { Reminder } from "./types"
import { computeNextFireAt } from "./reminder"

const LOCAL_FIRED_KEY = "tasker.localFired.v1"

type FiredMap = Record<string, number>

function readFired(): FiredMap {
  if (typeof window === "undefined") return {}
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_FIRED_KEY) || "{}")
  } catch {
    return {}
  }
}

function writeFired(map: FiredMap) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(LOCAL_FIRED_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

async function showLocalNotification(r: Reminder) {
  if (typeof Notification === "undefined") return
  if (Notification.permission !== "granted") return

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.getRegistration()
    if (reg) {
      reg.showNotification(r.title, {
        body: r.body ?? "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: r.id,
        data: { url: "/" },
      })
      return
    }
  }
  new Notification(r.title, { body: r.body ?? "", icon: "/icon-192.png" })
}

export function useLocalReminderScheduler(args: {
  reminders: Reminder[]
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>
  enabled: boolean
}) {
  const { reminders, setReminders, enabled } = args
  const remindersRef = React.useRef(reminders)
  React.useEffect(() => {
    remindersRef.current = reminders
  }, [reminders])

  React.useEffect(() => {
    if (!enabled) return
    if (typeof window === "undefined") return

    let cancelled = false

    async function tick() {
      if (cancelled) return
      const now = Date.now()
      const fired = readFired()
      const list = remindersRef.current
      const updates: { id: string; next: number; fireOnce: boolean }[] = []

      for (const r of list) {
        if (!r.enabled || !r.nextFireAt) continue
        if (r.nextFireAt > now) continue
        // throttle: don't refire same reminder within 50s window
        if (fired[r.id] && now - fired[r.id] < 50_000) continue
        await showLocalNotification(r)
        fired[r.id] = now
        if (r.repeat === "once") {
          updates.push({ id: r.id, next: 0, fireOnce: true })
        } else {
          const next = computeNextFireAt(r, new Date(now + 60_000))
          updates.push({ id: r.id, next, fireOnce: false })
        }
      }

      writeFired(fired)

      if (updates.length > 0) {
        setReminders((prev) =>
          prev.map((r) => {
            const u = updates.find((x) => x.id === r.id)
            if (!u) return r
            return u.fireOnce
              ? { ...r, lastFiredAt: now, enabled: false, nextFireAt: 0 }
              : { ...r, lastFiredAt: now, nextFireAt: u.next }
          }),
        )
      }
    }

    tick()
    const id = window.setInterval(tick, 30_000)

    function onVisible() {
      if (document.visibilityState === "visible") tick()
    }
    document.addEventListener("visibilitychange", onVisible)

    return () => {
      cancelled = true
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", onVisible)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
}
