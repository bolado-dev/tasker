import { NextResponse } from "next/server"

import { deleteSubscription, subscriptionId } from "@/lib/push"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  let body: { endpoint?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint requerido" }, { status: 400 })
  }

  await deleteSubscription(subscriptionId(body.endpoint))
  return NextResponse.json({ ok: true })
}
