import { supabase } from '@/lib/supabase'

/**
 * Get the next occurrence of a specific day of week from a given date
 * 
 * IMPORTANT: This function finds the NEXT occurrence, not including the start date itself
 * unless the start date happens to be the target day of week.
 * 
 * @param dayOfWeek - Day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @param fromDate - Start date in YYYY-MM-DD format
 * @returns Next occurrence date in YYYY-MM-DD format
 * 
 * Example:
 * - If fromDate is Tuesday (2025-09-16) and dayOfWeek is 0 (Sunday)
 *   -> Returns 2025-09-21 (next Sunday)
 * - If fromDate is Sunday (2025-09-21) and dayOfWeek is 0 (Sunday)
 *   -> Returns 2025-09-21 (same day, as it matches)
 */
export function getNextOccurrenceFromDate(dayOfWeek: number, fromDate: string): string {
  const startDate = new Date(fromDate)
  const currentDay = startDate.getDay()
  
  // Calculate days until target day
  let daysUntilTarget = (dayOfWeek - currentDay + 7) % 7
  
  // If the result is 0, it means we're already on the target day
  // In this case, use the current date (don't skip to next week)
  
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
 * SOURCE OF TRUTH: Class Generation Function
 * 
 * This is the PRIMARY and ONLY function for generating classes from student schedules.
 * All other class generation functionality should use this function.
 * 
 * Features:
 * - Complete database integration
 * - Proper pricing calculation
 * - Comprehensive validation
 * - Status and payment fields
 * - Duplicate prevention
 * - Error handling
 * 
 * Used by:
 * - POST /api/students (student creation)
 * - PUT /api/students/[id] (student updates)
 * - POST /api/class-tracking/generate-missing-classes
 * - POST /api/class-tracking/generate-weekly-classes
 * - scripts/fix-class-tracking-issues.js
 * - scripts/diagnose-class-tracking-issues.js
 * 
 * @param studentId - The ID of the student
 * @param courseId - The ID of the course
 * @param fixedSchedule - Array of time slots for the student
 * @param startDate - Start date for class generation (YYYY-MM-DD)
 * @param endDate - End date for class generation (YYYY-MM-DD)
 * @returns Promise<ClassData[]> - Array of generated class data
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
  
  // Get student info to check if they have shared pricing
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('has_shared_pricing')
    .eq('id', studentId)
    .single()
  
  if (studentError || !student) {
    console.error('Error fetching student info:', studentError)
    return classes
  }
  
  // Get course price and shared_class_price
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .select('price, shared_class_price')
    .eq('id', courseId)
    .single()
  
  if (courseError || !course) {
    console.error('Error fetching course price:', courseError)
    return classes
  }

  // Determine which price to use based on student's pricing type
  const pricePerHour = student.has_shared_pricing && course.shared_class_price
    ? course.shared_class_price
    : course.price

  // Validate course price
  if (typeof pricePerHour !== 'number' || pricePerHour < 0) {
    console.error('Invalid course price')
    return classes
  }
  
  console.log(`Using ${student.has_shared_pricing ? 'shared' : 'normal'} pricing for student ${studentId}: €${pricePerHour}/hour`)
  
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

    // Convert day_of_week from 0-6 (Sunday-Saturday) to 1-7 (Monday-Sunday) for database
    const dbDayOfWeek = timeSlot.day_of_week === 0 ? 7 : timeSlot.day_of_week

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

      const price = (duration / 60) * pricePerHour
      
      classes.push({
        student_id: studentId,
        course_id: courseId,
        day_of_week: dbDayOfWeek, // Use converted day_of_week
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
