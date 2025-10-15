// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'
import { generateClassesFromStartDate } from '@/lib/class-generation'

export async function GET() {
  try {
    const students = await dbOperations.getAllStudents()
    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Received student data:', body)
    const { 
      first_name, last_name, email, birth_date, phone, parent_phone, parent_contact_type, 
      course_id, student_code, fixed_schedule, start_date, schedule, has_shared_pricing,
      // Fiscal data fields
      dni, nif, address, postal_code, city, province, country,
      // Receptor data fields
      receptor_nombre, receptor_apellidos, receptor_email,
      // Digital board link field
      digital_board_link
    } = body

    // ========================================
    // VALIDATION: Required Fields
    // ========================================
    // Check that all mandatory fields are present and not empty
    // This ensures data integrity before processing the student creation
    const missingFields = []
    if (!first_name) missingFields.push('first_name')
    if (!last_name) missingFields.push('last_name')
    if (!email) missingFields.push('email')
    if (!birth_date) missingFields.push('birth_date')
    if (!phone) missingFields.push('phone')
    if (!course_id) missingFields.push('course_id')
    if (!student_code) missingFields.push('student_code')
    if (!start_date) missingFields.push('start_date')

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields)
      return NextResponse.json({ error: `Faltan campos obligatorios: ${missingFields.join(', ')}` }, { status: 400 })
    }

    // ========================================
    // VALIDATION: Start Date Format and Logic
    // ========================================
    // Validate that start_date follows YYYY-MM-DD format and is not in the future
    // This prevents invalid date formats and ensures students can't start classes in the future
    
    // Check if start_date is in YYYY-MM-DD format using regex
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(start_date)) {
      return NextResponse.json({ 
        error: 'La fecha de inicio debe estar en formato YYYY-MM-DD (ej: 2024-01-15)' 
      }, { status: 400 })
    }

    // Parse the date and validate it's a valid date
    const startDateObj = new Date(start_date)
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json({ 
        error: 'Formato de fecha de inicio inválido. Use YYYY-MM-DD' 
      }, { status: 400 })
    }

    // Validate that start_date is not in the future
    // Students cannot start classes in the future - only today or in the past
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
    if (startDateObj > today) {
      return NextResponse.json({ 
        error: 'La fecha de inicio no puede ser en el futuro' 
      }, { status: 400 })
    }

    // ========================================
    // VALIDATION: Fixed Schedule (Optional)
    // ========================================
    // Validate fixed_schedule if provided - this is optional but if provided must be valid
    // Format: JSON array with objects containing day_of_week, start_time, end_time
    // Example: [{"day_of_week": 1, "start_time": "09:00", "end_time": "11:00"}]
    
    let parsedSchedule = null
    if (fixed_schedule) {
      try {
        // Parse JSON if it's a string, otherwise use as-is
        parsedSchedule = typeof fixed_schedule === 'string' 
          ? JSON.parse(fixed_schedule) 
          : fixed_schedule
        
        // Validate that it's an array
        if (!Array.isArray(parsedSchedule)) {
          return NextResponse.json({ 
            error: 'El horario fijo debe ser un array JSON con objetos que contengan day_of_week, start_time y end_time' 
          }, { status: 400 })
        }

        // Validate that the array is not empty
        if (parsedSchedule.length === 0) {
          return NextResponse.json({ 
            error: 'El horario fijo no puede estar vacío' 
          }, { status: 400 })
        }

        // Validate each time slot with comprehensive checks
        for (let i = 0; i < parsedSchedule.length; i++) {
          const slot = parsedSchedule[i]
          
          // Check if slot is an object
          if (typeof slot !== 'object' || slot === null) {
            return NextResponse.json({ 
              error: `El elemento ${i + 1} del horario fijo debe ser un objeto` 
            }, { status: 400 })
          }

          // Validate day_of_week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
          if (typeof slot.day_of_week !== 'number' || slot.day_of_week < 0 || slot.day_of_week > 6) {
            return NextResponse.json({ 
              error: `day_of_week inválido en el elemento ${i + 1} del horario fijo. Debe ser un número entre 0 (domingo) y 6 (sábado)` 
            }, { status: 400 })
          }

          // Validate start_time and end_time presence
          if (!slot.start_time || !slot.end_time) {
            return NextResponse.json({ 
              error: `start_time y end_time son requeridos en el elemento ${i + 1} del horario fijo` 
            }, { status: 400 })
          }

          // Validate time format (HH:MM) - 24-hour format
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
          if (!timeRegex.test(slot.start_time)) {
            return NextResponse.json({ 
              error: `start_time inválido en el elemento ${i + 1} del horario fijo. Debe estar en formato HH:MM (ej: 09:30)` 
            }, { status: 400 })
          }
          if (!timeRegex.test(slot.end_time)) {
            return NextResponse.json({ 
              error: `end_time inválido en el elemento ${i + 1} del horario fijo. Debe estar en formato HH:MM (ej: 11:30)` 
            }, { status: 400 })
          }

          // Validate that end_time is after start_time
          // This prevents invalid time ranges where end time is before or equal to start time
          const startMinutes = timeToMinutes(slot.start_time)
          const endMinutes = timeToMinutes(slot.end_time)
          if (endMinutes <= startMinutes) {
            return NextResponse.json({ 
              error: `end_time debe ser posterior a start_time en el elemento ${i + 1} del horario fijo` 
            }, { status: 400 })
          }
        }
      } catch (error) {
        return NextResponse.json({ 
          error: 'Error al parsear el horario fijo. Asegúrese de que sea un JSON válido' 
        }, { status: 400 })
      }
    }

    // Create student
    console.log('Creating student with data:', {
      first_name,
      last_name,
      email,
      birth_date,
      phone,
      parent_phone,
      parent_contact_type,
      course_id: Number(course_id),
      student_code,
      fixed_schedule,
      start_date
    })
    
    const studentId = await dbOperations.createStudent({
      first_name,
      last_name,
      email,
      birth_date,
      phone,
      parent_phone,
      parent_contact_type,
      course_id: Number(course_id),
      student_code,
      fixed_schedule,
      start_date,
      has_shared_pricing: has_shared_pricing || false,
      // Fiscal data fields
      dni,
      nif,
      address,
      postal_code,
      city,
      province,
      country,
      // Receptor data fields
      receptor_nombre,
      receptor_apellidos,
      receptor_email,
      // Digital board link field
      digital_board_link
    })
    
    console.log('Student created with ID:', studentId)

    // ========================================
    // AUTOMATIC CLASS GENERATION
    // ========================================
    // Generate classes automatically when a student is created with fixed_schedule
    // This ensures all classes from start_date to today are created with proper status
    
    let scheduleToProcess = schedule
    
    // If no schedule but fixed_schedule is provided, parse it
    if (!scheduleToProcess && fixed_schedule) {
      try {
        scheduleToProcess = typeof fixed_schedule === 'string' 
          ? JSON.parse(fixed_schedule) 
          : fixed_schedule
      } catch (error) {
        console.error('Error parsing fixed_schedule:', error)
      }
    }
    
    // Generate classes if we have a valid schedule
    if (scheduleToProcess && Array.isArray(scheduleToProcess) && scheduleToProcess.length > 0) {
      try {
        // Generate all classes from start date to today
        const generatedClasses = await generateClassesFromStartDate(
          Number(studentId),
          Number(course_id),
          scheduleToProcess,
          start_date,
          new Date().toISOString().split('T')[0]
        )
        
        if (generatedClasses.length > 0) {
          // Get existing classes to avoid duplicates using compound key
          const existingClasses = await dbOperations.getAllClasses()
          const existingClassKeys = new Set(
            existingClasses
              .filter(cls => cls.student_id === Number(studentId))
              .map(cls => `${cls.date}-${cls.start_time}-${cls.end_time}`)
          )
          
          // Filter out classes that already exist (duplicate prevention)
          const newClasses = generatedClasses.filter(genClass => 
            !existingClassKeys.has(`${genClass.date}-${genClass.start_time}-${genClass.end_time}`)
          )
          
          // Create only new classes to avoid duplicates
          if (newClasses.length > 0) {
            for (const classData of newClasses) {
              await dbOperations.createClass(classData)
            }
            console.log(`Created ${newClasses.length} new classes for student ${studentId} (${generatedClasses.length - newClasses.length} duplicates skipped)`)
          } else {
            console.log(`All classes for student ${studentId} already exist (${generatedClasses.length} duplicates skipped)`)
          }
        } else {
          console.log(`No classes generated for student ${studentId} - check fixed_schedule format`)
        }
      } catch (error) {
        console.error(`Error generating classes for student ${studentId}:`, error)
        // Don't fail the student creation if class generation fails
        // The student is already created successfully
      }
    } else {
      console.log(`No schedule provided for student ${studentId} - skipping class generation`)
    }

    return NextResponse.json({ id: studentId, message: 'Alumno creado exitosamente' })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// Helper functions
function timeToMinutes(time: string): number {
  if (!time) return 0
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function getNextOccurrence(dayOfWeek: number): string {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  
  // Convert dayOfWeek from 0-6 format to 1-7 format (1=Monday, 7=Sunday)
  let targetDay = dayOfWeek
  if (dayOfWeek === 0) {
    targetDay = 7 // Sunday
  }
  
  // Convert current day to 1-7 format
  const currentDayConverted = currentDay === 0 ? 7 : currentDay
  
  let daysToAdd = targetDay - currentDayConverted
  if (daysToAdd <= 0) daysToAdd += 7
  
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysToAdd)
  
  return nextDate.toISOString().split('T')[0]
}

