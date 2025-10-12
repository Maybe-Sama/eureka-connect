import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un código único para un estudiante
 * Formato: EUREKA-YYYY-XXXX donde XXXX es un número aleatorio de 4 dígitos
 */
export function generateStudentCode(): string {
  const year = new Date().getFullYear()
  const randomNum = Math.floor(Math.random() * 9000) + 1000 // 1000-9999
  return `EUREKA-${year}-${randomNum}`
}

/**
 * Formatea el código del estudiante para mostrar
 * Aplica formato de monospace y separa con guiones
 */
export function formatStudentCode(code: string | null | undefined): string {
  if (!code) return 'Sin código'
  return code.replace(/-/g, ' - ')
}

/**
 * Parsea un horario fijo desde un string
 * Convierte el formato de horario a un objeto legible
 */
export function parseFixedSchedule(schedule: string | null | undefined): string {
  if (!schedule) return 'Sin horario definido'
  
  try {
    // Si es un JSON string, parsearlo
    if (schedule.startsWith('{') || schedule.startsWith('[')) {
      const parsed = JSON.parse(schedule)
      if (Array.isArray(parsed)) {
        return parsed.join(', ')
      }
      return JSON.stringify(parsed)
    }
    
    // Si es un string simple, devolverlo tal como está
    return schedule
  } catch (error) {
    // Si hay error al parsear, devolver el string original
    return schedule
  }
}

/**
 * Convierte minutos a formato de tiempo HH:MM
 */
function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}

/**
 * Genera los slots de tiempo para el calendario
 * Crea slots de 15 minutos desde las 8:00 hasta las 22:00
 */
export function getTimeSlots(): string[] {
  const slots = []
  const START_HOUR = 8
  const TOTAL_HOURS = 14 // 8:00 to 22:00
  
  for (let hour = START_HOUR; hour < START_HOUR + TOTAL_HOURS; hour++) {
    for (let quarter = 0; quarter < 4; quarter++) {
      const minutes = quarter * 15
      const time = minutesToTime(hour * 60 + minutes)
      slots.push(time)
    }
  }
  return slots
}

/**
 * Formatea una fecha para mostrar
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Formatea una hora para mostrar
 */
export function formatTime(time: string): string {
  return time
}

/**
 * Obtiene el nombre del día de la semana en español
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[dayOfWeek] || 'Día inválido'
}

/**
 * Formatea un número como moneda en euros
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}
