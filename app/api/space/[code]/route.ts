import { NextResponse } from "next/server"

import { getRedis, SPACE_KEY } from "@/lib/redis"

export const runtime = "edge"
export const dynamic = "force-dynamic"

const CODE_RE = /^[a-z0-9-]{4,40}$/i

type Snapshot = {
  tasks?: unknown
  projects?: unknown
  habits?: unknown
  routine?: unknown
  events?: unknown
  recipes?: unknown
  sleep?: unknown
  weight?: unknown
  healthGoal?: unknown
  updatedAt?: number
}

function badRequest(msg: string) {
  return NextResponse.json({ error: msg }, { status: 400 })
}

function noBackend() {
  return NextResponse.json(
    { error: "El backend no está configurado. Falta KV_REST_API_URL/TOKEN." },
    { status: 503 },
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  if (!CODE_RE.test(code)) return badRequest("Código inválido")
  const redis = getRedis()
  if (!redis) return noBackend()
  const data = await redis.get<Snapshot>(SPACE_KEY(code))
  return NextResponse.json({ data: data ?? null })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  if (!CODE_RE.test(code)) return badRequest("Código inválido")
  const redis = getRedis()
  if (!redis) return noBackend()

  let body: Snapshot
  try {
    body = (await req.json()) as Snapshot
  } catch {
    return badRequest("JSON inválido")
  }

  const snapshot: Snapshot = {
    tasks: Array.isArray(body.tasks) ? body.tasks : [],
    projects: Array.isArray(body.projects) ? body.projects : [],
    habits: Array.isArray(body.habits) ? body.habits : [],
    routine: Array.isArray(body.routine) ? body.routine : [],
    events: Array.isArray(body.events) ? body.events : [],
    recipes: Array.isArray(body.recipes) ? body.recipes : [],
    sleep: Array.isArray(body.sleep) ? body.sleep : [],
    weight: Array.isArray(body.weight) ? body.weight : [],
    healthGoal:
      body.healthGoal && typeof body.healthGoal === "object" ? body.healthGoal : {},
    updatedAt: Date.now(),
  }

  await redis.set(SPACE_KEY(code), snapshot)
  return NextResponse.json({ ok: true, updatedAt: snapshot.updatedAt })
}
