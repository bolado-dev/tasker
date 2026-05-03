import { createHash } from "node:crypto"
import webpush from "web-push"

import { getRedis } from "./redis"
import type { Reminder } from "./types"

export type StoredSubscription = {
  id: string
  endpoint: string
  keys: { p256dh: string; auth: string }
  reminders: Reminder[]
  spaceCode?: string
  userAgent?: string
  createdAt: number
}

export const SUBS_SET = "tasker:push:subs"
export const SUB_KEY = (id: string) => `tasker:push:sub:${id}`

export function subscriptionId(endpoint: string) {
  return createHash("sha256").update(endpoint).digest("hex").slice(0, 24)
}

let configured = false
export function configureWebPush() {
  if (configured) return true
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? "mailto:noreply@example.com"
  if (!pub || !priv) return false
  webpush.setVapidDetails(subject, pub, priv)
  configured = true
  return true
}

export async function loadSubscription(id: string) {
  const redis = getRedis()
  if (!redis) return null
  return await redis.get<StoredSubscription>(SUB_KEY(id))
}

export async function saveSubscription(sub: StoredSubscription) {
  const redis = getRedis()
  if (!redis) return
  await redis.set(SUB_KEY(sub.id), sub)
  await redis.sadd(SUBS_SET, sub.id)
}

export async function deleteSubscription(id: string) {
  const redis = getRedis()
  if (!redis) return
  await redis.del(SUB_KEY(id))
  await redis.srem(SUBS_SET, id)
}

export async function listSubscriptionIds(): Promise<string[]> {
  const redis = getRedis()
  if (!redis) return []
  return await redis.smembers(SUBS_SET)
}

export { webpush }
