"use client"

import * as React from "react"
import type { Habit, Project, RoutineBlock, Task } from "./types"
import { replaceSnapshot } from "./storage"

const SPACE_KEY = "tasker.space.v1"

export type SyncStatus =
  | { kind: "off" }
  | { kind: "pulling" }
  | { kind: "pushing" }
  | { kind: "idle"; lastSyncAt: number }
  | { kind: "error"; message: string }

type Snapshot = {
  tasks: Task[]
  projects: Project[]
  habits: Habit[]
  routine: RoutineBlock[]
}

const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"
export function generateCode(length = 8) {
  let s = ""
  const arr = new Uint32Array(length)
  if (typeof crypto !== "undefined") {
    crypto.getRandomValues(arr)
  }
  for (let i = 0; i < length; i++) {
    const n = arr[i] || Math.floor(Math.random() * 1e9)
    s += ALPHABET[n % ALPHABET.length]
  }
  return s
}

export const CODE_PATTERN = /^[a-z0-9-]{4,40}$/i

export function readSpace(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(SPACE_KEY)
}

export function writeSpace(code: string | null) {
  if (typeof window === "undefined") return
  if (code) window.localStorage.setItem(SPACE_KEY, code)
  else window.localStorage.removeItem(SPACE_KEY)
}

const codeListeners = new Set<() => void>()

function subscribeCode(cb: () => void) {
  codeListeners.add(cb)
  function onStorage(e: StorageEvent) {
    if (e.key === SPACE_KEY) cb()
  }
  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage)
  }
  return () => {
    codeListeners.delete(cb)
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage)
    }
  }
}

export function useSpaceCode() {
  const code = React.useSyncExternalStore<string | null>(
    subscribeCode,
    () => readSpace(),
    () => null,
  )
  const update = React.useCallback((next: string | null) => {
    writeSpace(next)
    codeListeners.forEach((cb) => cb())
  }, [])
  return [code, update] as const
}

function snapshotEqual(a: Snapshot, b: Snapshot) {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function useSpaceSync(args: {
  code: string | null
  hydrated: boolean
  snapshot: Snapshot
}) {
  const { code, hydrated, snapshot } = args
  const [status, setStatus] = React.useState<SyncStatus>({ kind: "off" })
  const lastSnapshotRef = React.useRef<Snapshot | null>(null)
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pull when code changes (or first hydrate)
  React.useEffect(() => {
    if (!hydrated) return
    if (!code) {
      lastSnapshotRef.current = null
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus({ kind: "off" })
      return
    }
    let cancelled = false
    setStatus({ kind: "pulling" })
    fetch(`/api/space/${encodeURIComponent(code)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((body: { data: Snapshot | null }) => {
        if (cancelled) return
        if (body.data) {
          replaceSnapshot(body.data)
          lastSnapshotRef.current = body.data
          setStatus({ kind: "idle", lastSyncAt: Date.now() })
        } else {
          // No remote yet — push current local up
          lastSnapshotRef.current = null
          setStatus({ kind: "idle", lastSyncAt: Date.now() })
        }
      })
      .catch((err: Error) => {
        if (cancelled) return
        setStatus({ kind: "error", message: err.message })
      })
    return () => {
      cancelled = true
    }
  }, [code, hydrated])

  // Push (debounced) on snapshot change
  React.useEffect(() => {
    if (!hydrated || !code) return
    if (status.kind === "pulling") return
    const last = lastSnapshotRef.current
    if (last && snapshotEqual(last, snapshot)) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        setStatus({ kind: "pushing" })
        const res = await fetch(`/api/space/${encodeURIComponent(code)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        lastSnapshotRef.current = snapshot
        setStatus({ kind: "idle", lastSyncAt: Date.now() })
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error"
        setStatus({ kind: "error", message })
      }
    }, 800)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, hydrated, snapshot])

  return status
}
