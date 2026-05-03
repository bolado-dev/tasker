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

export function formatDayHeading(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  const today = todayISO()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const isoTomorrow = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`
  const isoYesterday = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`
  if (iso === today) return `Hoy · ${SPANISH_DAYS[date.getDay()]} ${date.getDate()} de ${SPANISH_MONTHS[date.getMonth()]}`
  if (iso === isoTomorrow)
    return `Mañana · ${SPANISH_DAYS[date.getDay()]} ${date.getDate()} de ${SPANISH_MONTHS[date.getMonth()]}`
  if (iso === isoYesterday)
    return `Ayer · ${SPANISH_DAYS[date.getDay()]} ${date.getDate()} de ${SPANISH_MONTHS[date.getMonth()]}`
  return `${SPANISH_DAYS[date.getDay()]} ${date.getDate()} de ${SPANISH_MONTHS[date.getMonth()]}`
}

function pad(n: number) {
  return String(n).padStart(2, "0")
}

export function shiftISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number)
  const date = new Date(y, (m || 1) - 1, d || 1)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
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
  if (p === "high")
    return "bg-foreground/10 text-foreground border-transparent font-medium"
  if (p === "med")
    return "bg-muted text-muted-foreground border-transparent"
  return "bg-transparent text-muted-foreground border-transparent"
}

export function priorityDot(p: "low" | "med" | "high") {
  if (p === "high") return "bg-foreground/70"
  if (p === "med") return "bg-foreground/40"
  return "bg-foreground/20"
}

export function streakWord(days: number) {
  if (days === 0) return "Hoy empiezas"
  if (days === 1) return "1 día limpio"
  return `${days} días limpio`
}
