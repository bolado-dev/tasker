import { NextResponse } from "next/server"

import {
  configureWebPush,
  deleteSubscription,
  listSubscriptionIds,
  loadSubscription,
  saveSubscription,
  webpush,
} from "@/lib/push"
import { computeNextFireAt } from "@/lib/reminder"
import type { Reminder } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

type WebPushError = Error & { statusCode?: number }

function authorized(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const auth = req.headers.get("authorization") ?? ""
  return auth === `Bearer ${secret}`
}

export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 })
  }
  if (!configureWebPush()) {
    return NextResponse.json(
      { error: "Push no configurado" },
      { status: 503 },
    )
  }

  const now = Date.now()
  const ids = await listSubscriptionIds()
  let firedCount = 0
  let droppedCount = 0
  let subsTouched = 0

  for (const id of ids) {
    const sub = await loadSubscription(id)
    if (!sub) continue

    const dueIdx: number[] = []
    sub.reminders.forEach((r, i) => {
      if (!r.enabled) return
      if (!r.nextFireAt) return
      if (r.nextFireAt <= now) dueIdx.push(i)
    })

    if (dueIdx.length === 0) continue

    let removeSub = false

    for (const i of dueIdx) {
      const r = sub.reminders[i]
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys,
          },
          JSON.stringify({
            id: r.id,
            title: r.title,
            body: r.body ?? "",
            tag: r.id,
            url: "/",
          }),
        )
        firedCount++
      } catch (err) {
        const e = err as WebPushError
        if (e.statusCode === 404 || e.statusCode === 410) {
          removeSub = true
          droppedCount++
          break
        }
        // transient error: don't advance, retry next tick
        continue
      }
    }

    if (removeSub) {
      await deleteSubscription(id)
      continue
    }

    const nextReminders: Reminder[] = sub.reminders.map((r, i) => {
      if (!dueIdx.includes(i)) return r
      if (r.repeat === "once") {
        return { ...r, lastFiredAt: now, enabled: false, nextFireAt: 0 }
      }
      const next = computeNextFireAt(r, new Date(now + 60_000))
      return { ...r, lastFiredAt: now, nextFireAt: next }
    })

    await saveSubscription({ ...sub, reminders: nextReminders })
    subsTouched++
  }

  return NextResponse.json({
    ok: true,
    now,
    subsScanned: ids.length,
    subsTouched,
    fired: firedCount,
    dropped: droppedCount,
  })
}

export async function POST(req: Request) {
  return GET(req)
}
