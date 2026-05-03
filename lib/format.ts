export function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export function daysSince(dateISO: string) {
  const start = new Date(dateISO + "T00:00:00")
  const now = new Date()
  const ms = now.getTime() - start.getTime()
  return Math.max(0, Math.floor(ms / 86400000))
}

const SPANISH_DAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
]

const SPANISH_MONTHS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

export function formatLongDate(d = new Date()) {
  return `${SPANISH_DAYS[d.getDay()]}, ${d.getDate()} de ${SPANISH_MONTHS[d.getMonth()]}`
}

export function formatTime(time: string) {
  return time
}

export function isToday(iso?: string) {
  if (!iso) return false
  return iso === todayISO()
}

export function priorityLabel(p: "low" | "med" | "high") {
  return p === "high" ? "Alta" : p === "med" ? "Media" : "Baja"
}

export function priorityClasses(p: "low" | "med" | "high") {
  if (p === "high") return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
  if (p === "med") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
  return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
}

export function streakWord(days: number) {
  if (days === 0) return "Hoy empiezas"
  if (days === 1) return "1 día limpio"
  return `${days} días limpio`
}
