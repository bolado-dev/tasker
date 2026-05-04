import { NextResponse } from "next/server"

import {
  configureWebPush,
  saveSubscription,
  subscriptionId,
  type StoredSubscription,
} from "@/lib/push"
import type { Reminder } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  subscription?: {
    endpoint: string
    keys?: { p256dh?: string; auth?: string }
  }
  reminders?: Reminder[]
  spaceCode?: string
  userAgent?: string
}

export async function POST(req: Request) {
  if (!configureWebPush()) {
    return NextResponse.json(
      { error: "Push no configurado (faltan VAPID keys)" },
      { status: 503 },
    )
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const sub = body.subscription
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 })
  }

  const id = subscriptionId(sub.endpoint)
  const stored: StoredSubscription = {
    id,
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    reminders: Array.isArray(body.reminders) ? body.reminders : [],
    spaceCode: body.spaceCode,
    userAgent: body.userAgent,
    createdAt: Date.now(),
  }
 
  await saveSubscription(stored)
  return NextResponse.json({ ok: true, id })
}
