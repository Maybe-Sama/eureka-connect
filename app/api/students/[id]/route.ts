import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'
import { generateClassesFromStartDate } from '@/lib/class-generation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await dbOperations.getStudentById(Number(params.id))
    if (!student) {
      return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 })
    }
    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { 
      first_name, last_name, email, birth_date, phone, parent_phone, parent_contact_type, 
      course_id, schedule, fixed_schedule, start_date,
      // Fiscal data fields
      dni, nif, address, postal_code, city, province, country,
      // Receptor data fields
      receptor_nombre, receptor_apellidos, receptor_email
    } = body

    // Si solo se está actualizando el fixed_schedule, no validar campos obligatorios
    if (fixed_schedule && !first_name && !last_name && !email && !birth_date && !phone && !course_id) {
      const result = await dbOperations.updateStudent(Number(params.id), {
        fixed_schedule
      })
      return NextResponse.json({ message: 'Horario fijo actualizado exitosamente' })
    }

    if (!first_name || !last_name || !email || !birth_date || !phone || !course_id || !start_date) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Validate start_date format
    const startDateObj = new Date(start_date)
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json({ error: 'Formato de fecha de inicio inválido' }, { status: 400 })
    }

    // Validate fixed_schedule if provided
    if (fixed_schedule) {
      try {
        const parsedSchedule = typeof fixed_schedule === 'string' 
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

    // Update student information
    const result = await dbOperations.updateStudent(Number(params.id), {
      first_name,
      last_name,
      email,
      birth_date,
      phone,
      parent_phone,
      parent_contact_type,
      course_id: Number(course_id),
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

    // Update schedule if provided
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
      // Delete existing classes for this student first
      const allClasses = await dbOperations.getAllClasses()
      const existingClasses = allClasses.filter(cls => cls.student_id === Number(params.id))
      
      for (const cls of existingClasses) {
        await dbOperations.deleteClass(cls.id)
      }
      
      // Generate all classes from start date to today
      const generatedClasses = await generateClassesFromStartDate(
        Number(params.id),
        Number(course_id),
        scheduleToProcess,
        start_date,
        new Date().toISOString().split('T')[0]
      )
      
      // Create all generated classes
      for (const classData of generatedClasses) {
        await dbOperations.createClass(classData)
      }
      
      console.log(`Updated ${generatedClasses.length} classes for student ${params.id}`)
    }

    return NextResponse.json({ message: 'Alumno actualizado exitosamente' })
  } catch (error) {
    console.error('Error updating student:', error)
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await dbOperations.deleteStudent(Number(params.id))
    return NextResponse.json({ message: 'Alumno eliminado exitosamente' })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
