import { supabase } from '@/lib/supabase'

// Helper function to get next occurrence of a day of week from a specific date
export function getNextOccurrenceFromDate(dayOfWeek: number, fromDate: string): string {
  const startDate = new Date(fromDate)
  const currentDay = startDate.getDay()
  const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7
  const targetDate = new Date(startDate)
  targetDate.setDate(startDate.getDate() + daysUntilTarget)
  return targetDate.toISOString().split('T')[0]
}

// Helper function to calculate duration in minutes
export function calculateDuration(startTime: string, endTime: string): number {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  return (end.getTime() - start.getTime()) / (1000 * 60)
}

// Helper function to convert time string to minutes
export function timeToMinutes(time: string): number {
  if (!time) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Generate all classes from start date to end date for a student
 * Optimized version with better error handling and validation
 */
export async function generateClassesFromStartDate(
  studentId: number,
  courseId: number,
  fixedSchedule: any[],
  startDate: string,
  endDate: string = new Date().toISOString().split('T')[0]
) {
  // Validate inputs
  if (!studentId || !courseId) {
    console.error('Invalid studentId or courseId')
    return []
  }

  if (!fixedSchedule || !Array.isArray(fixedSchedule) || fixedSchedule.length === 0) {
    console.error('Invalid or empty fixedSchedule')
    return []
  }

  if (!startDate || !endDate) {
    console.error('Invalid startDate or endDate')
    return []
  }

  // Validate dates
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error('Invalid date format')
    return []
  }

  if (start > end) {
    console.error('startDate cannot be after endDate')
    return []
  }

  // Check if date range is too large (more than 2 years)
  const daysDifference = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (daysDifference > 730) {
    console.warn(`Large date range detected: ${daysDifference} days. This may take a while.`)
  }

  const classes: any[] = []
  
  // Get course price (with caching potential)
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('price')
    .eq('id', courseId)
    .single()
  
  if (courseError || !course) {
    console.error('Error fetching course price:', courseError)
    return classes
  }

  // Validate course price
  if (typeof course.price !== 'number' || course.price < 0) {
    console.error('Invalid course price')
    return classes
  }
  
  // Generate classes for each time slot
  for (const timeSlot of fixedSchedule) {
    // Validate time slot
    if (!timeSlot || typeof timeSlot.day_of_week !== 'number') {
      console.warn('Invalid time slot, skipping:', timeSlot)
      continue
    }

    if (timeSlot.day_of_week < 0 || timeSlot.day_of_week > 6) {
      console.warn('Invalid day_of_week, skipping:', timeSlot.day_of_week)
      continue
    }

    if (!timeSlot.start_time || !timeSlot.end_time) {
      console.warn('Missing start_time or end_time, skipping:', timeSlot)
      continue
    }

    // Get the first occurrence of this day of week from start date
    let currentDate = getNextOccurrenceFromDate(timeSlot.day_of_week, startDate)
    
    // Generate classes week by week
    while (currentDate <= endDate) {
      const duration = calculateDuration(timeSlot.start_time, timeSlot.end_time)
      
      // Validate duration
      if (duration <= 0 || duration > 1440) { // Max 24 hours
        console.warn('Invalid duration, skipping class:', duration)
        break
      }

      const price = (duration / 60) * course.price
      
      classes.push({
        student_id: studentId,
        course_id: courseId,
        day_of_week: timeSlot.day_of_week,
        date: currentDate,
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time,
        duration: duration,
        price: parseFloat(price.toFixed(2)), // Round to 2 decimals
        status: 'scheduled',
        payment_status: 'unpaid',
        payment_notes: '',
        is_recurring: true,
        subject: timeSlot.subject || '',
        notes: `Generado automáticamente desde horario fijo`
      })
      
      // Move to next week
      const nextDate = new Date(currentDate)
      nextDate.setDate(nextDate.getDate() + 7)
      currentDate = nextDate.toISOString().split('T')[0]
    }
  }
  
  console.log(`Generated ${classes.length} classes for student ${studentId} from ${startDate} to ${endDate}`)
  return classes
}
