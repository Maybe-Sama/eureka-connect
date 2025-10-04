import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'
import { generateClassesFromStartDate } from '@/lib/class-generation'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)
    
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'ID de estudiante inválido' },
        { status: 400 }
      )
    }

    // Get student with fixed_schedule
    const student = await dbOperations.getStudentById(studentId)
    if (!student) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // Parse fixed_schedule if it exists
    let schedule = []
    if (student.fixed_schedule) {
      try {
        schedule = typeof student.fixed_schedule === 'string' 
          ? JSON.parse(student.fixed_schedule) 
          : student.fixed_schedule
      } catch (error) {
        console.error('Error parsing fixed_schedule:', error)
        return NextResponse.json(
          { error: 'Error al parsear el horario fijo' },
          { status: 500 }
        )
      }
    }
    
    console.log('Fixed schedule for student:', schedule)
    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching student schedule:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = parseInt(params.id)
    
    if (isNaN(studentId)) {
      return NextResponse.json(
        { error: 'ID de estudiante inválido' },
        { status: 400 }
      )
    }

    const { schedule } = await request.json()
    
    if (!Array.isArray(schedule)) {
      return NextResponse.json(
        { error: 'El horario debe ser un array' },
        { status: 400 }
      )
    }

    // Get student to get course_id and other data
    const student = await dbOperations.getStudentById(studentId)
    if (!student) {
      return NextResponse.json(
        { error: 'Estudiante no encontrado' },
        { status: 404 }
      )
    }

    // 1. First update the fixed_schedule field in the student record
    const fixedScheduleJson = JSON.stringify(schedule)
    await dbOperations.updateStudent(studentId, {
      fixed_schedule: fixedScheduleJson
    })
    console.log(`Updated fixed_schedule for student ${studentId}:`, schedule)

    // 2. Delete existing recurring classes for this student ONLY from today onwards (preserve historical data)
    const today = new Date().toISOString().split('T')[0]
    const allClasses = await dbOperations.getAllClasses()
    const existingRecurringClasses = allClasses.filter(cls => 
      cls.student_id === studentId && 
      cls.is_recurring === true &&
      cls.date >= today // Solo eliminar clases de hoy en adelante
    )
    
    console.log(`Deleting ${existingRecurringClasses.length} future recurring classes for student ${studentId} (from ${today} onwards)`)
    console.log('Preserving historical classes before:', today)
    for (const cls of existingRecurringClasses) {
      await dbOperations.deleteClass(cls.id)
    }

    // 3. Generate new classes from today onwards (preserve historical classes)
    if (schedule.length > 0) {
      // Calcular fecha de fin (por ejemplo, 3 meses en el futuro)
      const futureEndDate = new Date()
      futureEndDate.setMonth(futureEndDate.getMonth() + 3)
      const endDate = futureEndDate.toISOString().split('T')[0]
      
      const generatedClasses = await generateClassesFromStartDate(
        studentId,
        Number(student.course_id),
        schedule,
        today, // Empezar desde hoy, no desde la fecha de inicio original
        endDate
      )
      
      // Create all generated classes
      console.log(`Creating ${generatedClasses.length} new classes for student ${studentId}`)
      for (const classData of generatedClasses) {
        await dbOperations.createClass(classData)
      }
      
      console.log(`Updated ${generatedClasses.length} classes for student ${studentId}`)
    } else {
      console.log(`No schedule provided - only deleted existing classes for student ${studentId}`)
    }

    return NextResponse.json({ 
      message: 'Horario actualizado exitosamente',
      scheduleUpdated: true,
      classesGenerated: schedule.length > 0
    })
  } catch (error) {
    console.error('Error updating student schedule:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// Helper function to convert time string to minutes
function timeToMinutes(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number)
  return hours * 60 + minutes
}