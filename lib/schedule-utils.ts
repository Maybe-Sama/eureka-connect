/**
 * Utilidades para manejo de horarios de estudiantes
 */

export interface TimeSlot {
  day_of_week: number
  start_time: string
  end_time: string
  subject?: string
}

/**
 * Convierte un string JSON de fixed_schedule a array de TimeSlot
 * @param fixedSchedule - String JSON del horario fijo
 * @returns Array de TimeSlot o array vacío si hay error
 */
export function parseFixedSchedule(fixedSchedule: string | null): TimeSlot[] {
  if (!fixedSchedule) return []
  
  try {
    return JSON.parse(fixedSchedule)
  } catch (error) {
    console.error('Error parsing fixed schedule:', error)
    return []
  }
}

/**
 * Convierte un array de TimeSlot a string JSON para fixed_schedule
 * @param schedule - Array de TimeSlot
 * @returns String JSON o null si el array está vacío
 */
export function stringifyFixedSchedule(schedule: TimeSlot[]): string | null {
  if (!schedule || schedule.length === 0) return null
  
  try {
    return JSON.stringify(schedule)
  } catch (error) {
    console.error('Error stringifying fixed schedule:', error)
    return null
  }
}

/**
 * Normaliza una hora para comparación (quita segundos si existen)
 * @param time - Hora en formato HH:MM o HH:MM:SS
 * @returns Hora normalizada en formato HH:MM
 */
export function normalizeTime(time: string): string {
  if (!time) return ''
  return time.split(':').slice(0, 2).join(':')
}

/**
 * Convierte tiempo a minutos desde medianoche
 * @param time - Hora en formato HH:MM o HH:MM:SS
 * @returns Minutos desde medianoche
 */
export function timeToMinutes(time: string): number {
  if (!time) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Calcula la próxima fecha para un día de la semana
 * @param dayOfWeek - Día de la semana (1-7, donde 1=Lunes, 7=Domingo)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getNextOccurrence(dayOfWeek: number): string {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek // Convert to 1-7 format
  
  let daysToAdd = targetDay - currentDay
  if (daysToAdd <= 0) daysToAdd += 7
  
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysToAdd)
  
  return nextDate.toISOString().split('T')[0]
}

/**
 * @deprecated OBSOLETE - Use lib/class-generation.ts generateClassesFromStartDate instead
 * 
 * This function is incomplete and lacks database integration, pricing, and proper validation.
 * It only generates basic class data without the necessary fields for the system.
 * 
 * @see lib/class-generation.ts generateClassesFromStartDate - Source of truth for class generation
 * 
 * @param fixedSchedule - Array de TimeSlot del horario fijo
 * @param startDate - Fecha de inicio de clases del estudiante (YYYY-MM-DD)
 * @param endDate - Fecha final (por defecto hoy) (YYYY-MM-DD)
 * @returns Array de objetos con la información de las clases generadas
 */
export function generateFixedClassesFromStartDate(
  fixedSchedule: TimeSlot[], 
  startDate: string, 
  endDate: string = new Date().toISOString().split('T')[0]
): Array<{
  day_of_week: number
  start_time: string
  end_time: string
  subject?: string
  date: string
}> {
  if (!fixedSchedule || fixedSchedule.length === 0) return []
  
  const classes: Array<{
    day_of_week: number
    start_time: string
    end_time: string
    subject?: string
    date: string
  }> = []
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  // Iterar desde la fecha de inicio hasta la fecha final
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay() // Convertir 0 (domingo) a 7
    
    // Buscar slots de horario fijo para este día de la semana
    const slotsForDay = fixedSchedule.filter(slot => slot.day_of_week === dayOfWeek)
    
    // Generar clase para cada slot
    for (const slot of slotsForDay) {
      classes.push({
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        subject: slot.subject,
        date: date.toISOString().split('T')[0]
      })
    }
  }
  
  return classes
}

/**
 * Calcula la próxima fecha para un día de la semana desde una fecha específica
 * @param dayOfWeek - Día de la semana (1-7, donde 1=Lunes, 7=Domingo)
 * @param fromDate - Fecha desde la cual calcular (YYYY-MM-DD)
 * @returns Fecha en formato YYYY-MM-DD
 */
export function getNextOccurrenceFromDate(dayOfWeek: number, fromDate: string): string {
  const from = new Date(fromDate)
  const currentDay = from.getDay() // 0 = Sunday, 1 = Monday, etc.
  const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek // Convert to 1-7 format
  
  let daysToAdd = targetDay - currentDay
  if (daysToAdd <= 0) daysToAdd += 7
  
  const nextDate = new Date(from)
  nextDate.setDate(from.getDate() + daysToAdd)
  
  return nextDate.toISOString().split('T')[0]
}


