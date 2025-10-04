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
      course_id, student_code, fixed_schedule, start_date, schedule,
      // Fiscal data fields
      dni, nif, address, postal_code, city, province, country,
      // Receptor data fields
      receptor_nombre, receptor_apellidos, receptor_email
    } = body

    // Validate required fields
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

    // Validate start_date format and logic
    const startDateObj = new Date(start_date)
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json({ error: 'Formato de fecha de inicio inválido' }, { status: 400 })
    }

    // Validate fixed_schedule if provided
    let parsedSchedule = null
    if (fixed_schedule) {
      try {
        parsedSchedule = typeof fixed_schedule === 'string' 
          ? JSON.parse(fixed_schedule) 
          : fixed_schedule
        
        if (!Array.isArray(parsedSchedule)) {
          return NextResponse.json({ error: 'El horario fijo debe ser un array' }, { status: 400 })
        }

        // Validate each time slot
        for (const slot of parsedSchedule) {
          if (typeof slot.day_of_week !== 'number' || slot.day_of_week < 0 || slot.day_of_week > 6) {
            return NextResponse.json({ error: 'day_of_week inválido en el horario fijo' }, { status: 400 })
          }
          if (!slot.start_time || !slot.end_time) {
            return NextResponse.json({ error: 'start_time y end_time son requeridos en el horario fijo' }, { status: 400 })
          }
        }
      } catch (error) {
        return NextResponse.json({ error: 'Error al parsear el horario fijo' }, { status: 400 })
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
      receptor_email
    })
    
    console.log('Student created with ID:', studentId)

    // Create classes if schedule is provided
    let scheduleToProcess = schedule
    
    // If no schedule but fixed_schedule is provided, parse it
    if (!scheduleToProcess && fixed_schedule) {
      try {
        scheduleToProcess = JSON.parse(fixed_schedule)
      } catch (error) {
        console.error('Error parsing fixed_schedule:', error)
      }
    }
    
    if (scheduleToProcess && Array.isArray(scheduleToProcess)) {
      // Generate all classes from start date to today
      const generatedClasses = await generateClassesFromStartDate(
        Number(studentId),
        Number(course_id),
        scheduleToProcess,
        start_date,
        new Date().toISOString().split('T')[0]
      )
      
      // Create all generated classes
      for (const classData of generatedClasses) {
        await dbOperations.createClass(classData)
      }
      
      console.log(`Created ${generatedClasses.length} classes for student ${studentId}`)
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

