import type { Reminder, ReminderRepeat } from "./types"

export function parseTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  return { h: h || 0, m: m || 0 }
}

export function computeNextFireAt(
  r: Pick<Reminder, "repeat" | "time" | "date" | "weekday">,
  from = new Date(),
): number {
  const { h, m } = parseTime(r.time)

  if (r.repeat === "once") {
    if (!r.date) return 0
    const [y, mo, d] = r.date.split("-").map(Number)
    const dt = new Date(y, (mo || 1) - 1, d || 1, h, m, 0, 0)
    return dt.getTime()
  }

  if (r.repeat === "daily") {
    const candidate = new Date(from)
    candidate.setHours(h, m, 0, 0)
    if (candidate.getTime() <= from.getTime()) {
      candidate.setDate(candidate.getDate() + 1)
    }
    return candidate.getTime()
  }

  if (r.repeat === "weekdays") {
    const candidate = new Date(from)
    candidate.setHours(h, m, 0, 0)
    if (candidate.getTime() <= from.getTime()) {
      candidate.setDate(candidate.getDate() + 1)
    }
    while (candidate.getDay() === 0 || candidate.getDay() === 6) {
      candidate.setDate(candidate.getDate() + 1)
    }
    return candidate.getTime()
  }

  if (r.repeat === "weekly") {
    const target = r.weekday ?? from.getDay()
    const candidate = new Date(from)
    candidate.setHours(h, m, 0, 0)
    let delta = (target - candidate.getDay() + 7) % 7
    if (delta === 0 && candidate.getTime() <= from.getTime()) delta = 7
    candidate.setDate(candidate.getDate() + delta)
    return candidate.getTime()
  }

  return 0
}

export function refreshReminder(r: Reminder, now = new Date()): Reminder {
  if (r.repeat === "once" && r.lastFiredAt) {
    return { ...r, enabled: false, nextFireAt: 0 }
  }
  const next = computeNextFireAt(r, now)
  return { ...r, nextFireAt: next }
}

export function describeRepeat(repeat: ReminderRepeat, weekday?: number) {
  if (repeat === "once") return "Una vez"
  if (repeat === "daily") return "Cada día"
  if (repeat === "weekdays") return "Lun a Vie"
  if (repeat === "weekly") {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
    return `Cada ${days[weekday ?? 1]}`
  }
  return ""
}

export function formatNextFire(ts: number, now = Date.now()) {
  if (!ts) return "—"
  const diff = ts - now
  if (diff < 0) return "vencido"
  const min = Math.round(diff / 60000)
  if (min < 1) return "en menos de 1 min"
  if (min < 60) return `en ${min} min`
  const hr = Math.round(min / 60)
  if (hr < 24) return `en ${hr} h`
  const day = Math.round(hr / 24)
  return `en ${day} d`
}

export function formatFireDate(ts: number) {
  if (!ts) return ""
  const d = new Date(ts)
  const days = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
  const months = [
    "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
  ]
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} · ${hh}:${mm}`
}
