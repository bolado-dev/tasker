import { NextResponse } from "next/server"

import {
  loadSubscription,
  saveSubscription,
  subscriptionId,
} from "@/lib/push"
import type { Reminder } from "@/lib/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  endpoint?: string
  reminders?: Reminder[]
  spaceCode?: string
}

export async function POST(req: Request) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint requerido" }, { status: 400 })
  }

  const id = subscriptionId(body.endpoint)
  const existing = await loadSubscription(id)
  if (!existing) {
    return NextResponse.json({ error: "no suscrito" }, { status: 404 })
  }

  await saveSubscription({
    ...existing,
    reminders: Array.isArray(body.reminders) ? body.reminders : [],
    spaceCode: body.spaceCode ?? existing.spaceCode,
  })

  return NextResponse.json({ ok: true })
}
