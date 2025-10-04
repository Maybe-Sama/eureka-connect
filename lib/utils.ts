import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un código único de 20 cifras para estudiantes
 * Formato: 20 dígitos numéricos aleatorios
 */
export function generateStudentCode(): string {
  const digits = '0123456789'
  let code = ''
  
  for (let i = 0; i < 20; i++) {
    code += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  
  return code
}

/**
 * Valida que un código de estudiante tenga el formato correcto
 * @param code - Código a validar
 * @returns true si el código es válido
 */
export function validateStudentCode(code: string): boolean {
  return /^\d{20}$/.test(code)
}

/**
 * Formatea un código de estudiante para mostrar (agrupa en grupos de 4)
 * @param code - Código sin formato
 * @returns Código formateado (ej: 1234-5678-9012-3456-7890)
 */
export function formatStudentCode(code: string): string {
  return code.replace(/(\d{4})(?=\d)/g, '$1-')
}

/**
 * Formatea una fecha para mostrar en formato legible
 * @param date - Fecha a formatear
 * @returns Fecha formateada (ej: "15 Ene 2024")
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Formatea una hora para mostrar en formato 24h
 * @param time - Hora en formato string (HH:MM)
 * @returns Hora formateada (ej: "14:30")
 */
export function formatTime(time: string): string {
  return time
}

/**
 * Obtiene el nombre del día de la semana en español
 * @param dayOfWeek - Día de la semana (0-6, donde 0 es domingo)
 * @returns Nombre del día en español
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[dayOfWeek]
}

/**
 * Genera los slots de tiempo para el calendario semanal (cada 15 minutos)
 * @returns Array de strings con las horas en formato HH:MM
 */
export function getTimeSlots(): string[] {
  const slots = []
  for (let hour = 8; hour <= 23; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 23 || hour === 23) {
      slots.push(`${hour.toString().padStart(2, '0')}:15`)
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
      slots.push(`${hour.toString().padStart(2, '0')}:45`)
    }
  }
  // Agregar 00:00 del día siguiente como límite
  slots.push('00:00')
  return slots
}

/**
 * Formatea una cantidad monetaria en euros
 * @param amount - Cantidad a formatear
 * @returns Cantidad formateada (ej: "€1,234.56")
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Procesa el horario fijo de un estudiante desde JSON
 * @param fixedSchedule - Horario fijo en formato JSON string
 * @returns Array de objetos con day_of_week, start_time, end_time, subject
 */
export function parseFixedSchedule(fixedSchedule: string | null): Array<{
  day_of_week: number
  start_time: string
  end_time: string
  subject?: string
}> {
  if (!fixedSchedule) return []
  
  try {
    const schedule = JSON.parse(fixedSchedule)
    return Array.isArray(schedule) ? schedule : []
  } catch (error) {
    console.error('Error parsing fixed schedule:', error)
    return []
  }
}
