import type { Habit, Project, RoutineBlock, Task } from "./types"

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function id() {
  return Math.random().toString(36).slice(2, 10)
}

export function defaultProjects(): Project[] {
  const now = Date.now()
  return [
    {
      id: "proj-salud",
      name: "Salud y cuerpo",
      description: "Ejercicio, alimentación y descanso. Tu cuerpo es tu base.",
      color: "emerald",
      status: "active",
      createdAt: now,
    },
    {
      id: "proj-aprender",
      name: "Aprender algo nuevo",
      description: "Cursos, libros y skills que ocupen tu mente con cosas que importan.",
      color: "violet",
      status: "active",
      createdAt: now,
    },
    {
      id: "proj-personal",
      name: "Vida personal",
      description: "Familia, amistades y momentos que valen la pena.",
      color: "rose",
      status: "active",
      createdAt: now,
    },
  ]
}

export function defaultTasks(): Task[] {
  const today = todayISO()
  const now = Date.now()
  return [
    {
      id: id(),
      title: "Salir a caminar 30 minutos",
      done: false,
      priority: "high",
      projectId: "proj-salud",
      dueDate: today,
      createdAt: now,
      notes: "Sin teléfono. Solo tú y el aire.",
    },
    {
      id: id(),
      title: "Tomar 2 litros de agua",
      done: false,
      priority: "med",
      projectId: "proj-salud",
      dueDate: today,
      createdAt: now,
    },
    {
      id: id(),
      title: "Leer 20 páginas",
      done: false,
      priority: "med",
      projectId: "proj-aprender",
      dueDate: today,
      createdAt: now,
    },
    {
      id: id(),
      title: "Llamar a alguien importante",
      done: false,
      priority: "low",
      projectId: "proj-personal",
      dueDate: today,
      createdAt: now,
    },
  ]
}

export function defaultHabits(): Habit[] {
  const now = Date.now()
  return [
    {
      id: id(),
      name: "Sin redes sociales sin propósito",
      description: "Cada vez que abro el feed por aburrimiento, reinicio.",
      type: "quit",
      startDate: todayISO(),
      bestStreak: 0,
      totalRelapses: 0,
      createdAt: now,
    },
  ]
}

export function defaultRoutine(): RoutineBlock[] {
  return [
    {
      id: id(),
      label: "Mañana",
      startTime: "07:00",
      endTime: "09:00",
      activity: "Despertar, agua, ejercicio ligero",
      emoji: "🌅",
    },
    {
      id: id(),
      label: "Trabajo profundo",
      startTime: "09:00",
      endTime: "12:00",
      activity: "Lo más importante del día. Sin notificaciones.",
      emoji: "🎯",
    },
    {
      id: id(),
      label: "Almuerzo y pausa",
      startTime: "12:00",
      endTime: "13:30",
      activity: "Comer bien, alejarte de la pantalla",
      emoji: "🥗",
    },
    {
      id: id(),
      label: "Tarde productiva",
      startTime: "13:30",
      endTime: "17:00",
      activity: "Tareas del proyecto activo o aprender",
      emoji: "🛠️",
    },
    {
      id: id(),
      label: "Movimiento",
      startTime: "17:00",
      endTime: "18:30",
      activity: "Caminar, gym, deporte. Saca el cuerpo de la silla.",
      emoji: "🏃",
    },
    {
      id: id(),
      label: "Noche tranquila",
      startTime: "20:00",
      endTime: "22:30",
      activity: "Cena, leer, conversar. Sin pantallas la última hora.",
      emoji: "🌙",
    },
  ]
}
