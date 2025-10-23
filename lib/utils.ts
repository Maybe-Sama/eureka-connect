import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Genera un código único para un estudiante
 * Formato: 16 dígitos numéricos (XXXX-XXXX-XXXX-XXXX)
 */
export function generateStudentCode(): string {
  // Generar 16 dígitos aleatorios
  let code = ''
  for (let i = 0; i < 16; i++) {
    code += Math.floor(Math.random() * 10)
  }
  return code
}

/**
 * Formatea el código del estudiante para mostrar
 * Aplica formato de monospace y separa con guiones cada 4 dígitos
 */
export function formatStudentCode(code: string | null | undefined): string {
  if (!code) return 'Sin código'
  
  // Remove any existing hyphens and spaces
  const cleanCode = code.replace(/[-\s]/g, '')
  
  // For 16-digit codes, add hyphens every 4 digits
  if (cleanCode.length === 16) {
    return cleanCode.replace(/(.{4})/g, '$1-').replace(/-$/, '')
  }
  
  // For other formats, add hyphens every 4 characters
  return cleanCode.replace(/(.{4})/g, '$1-').replace(/-$/, '')
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
  } catch {
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
 * Crea slots de 15 minutos desde las 8:00 hasta las 23:00
 */
export function getTimeSlots(): string[] {
  const slots = []
  const START_HOUR = 8
  const TOTAL_HOURS = 15 // 8:00 to 23:00
  
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
 * Parsea una fecha en formato YYYY-MM-DD como fecha local (sin conversión de zona horaria)
 * Esto evita el problema de que JavaScript interprete las fechas como UTC y luego
 * las convierta a hora local, lo que puede hacer que se muestren un día antes.
 * 
 * @param dateString - Fecha en formato YYYY-MM-DD
 * @returns Objeto Date en hora local
 */
export function parseDateAsLocal(dateString: string): Date {
  // Si la fecha ya tiene información de hora, usar el constructor normal
  if (dateString.includes('T') || dateString.includes(' ')) {
    return new Date(dateString)
  }
  
  // Para fechas en formato YYYY-MM-DD, parsear como fecha local
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day) // month es 0-indexed en JavaScript
}

/**
 * Formatea una fecha para mostrar en español
 * Maneja correctamente fechas en formato YYYY-MM-DD sin problemas de zona horaria
 * 
 * @param date - Fecha como string (YYYY-MM-DD) o objeto Date
 * @param options - Opciones de formato (opcional)
 * @returns Fecha formateada en español
 */
export function formatDate(
  date: Date | string,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? parseDateAsLocal(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }
  
  return d.toLocaleDateString('es-ES', options || defaultOptions)
}

/**
 * Formatea una fecha en formato corto (DD/MM/YYYY)
 * 
 * @param date - Fecha como string (YYYY-MM-DD) o objeto Date
 * @returns Fecha formateada como DD/MM/YYYY
 */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseDateAsLocal(date) : date
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
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
