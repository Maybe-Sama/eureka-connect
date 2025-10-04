import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateClassesFromStartDate } from '@/lib/class-generation'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId } = body

    let studentsToProcess = []

    if (studentId) {
      // Process specific student
      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (error || !student) {
        return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
      }
      studentsToProcess = [student]
    } else {
      // Process all students
      const { data: students, error } = await supabase
        .from('students')
        .select('*')

      if (error || !students) {
        return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 })
      }
      studentsToProcess = students
    }

    let totalClassesCreated = 0
    let studentsProcessed = 0
    const results = []

    for (const student of studentsToProcess) {
      try {
        if (!student.fixed_schedule || !student.start_date) {
          results.push({
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            classesCreated: 0,
            message: 'Sin horario fijo o fecha de inicio'
          })
          continue
        }

        const fixedSchedule = typeof student.fixed_schedule === 'string' 
          ? JSON.parse(student.fixed_schedule) 
          : student.fixed_schedule

        if (!fixedSchedule || fixedSchedule.length === 0) {
          results.push({
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            classesCreated: 0,
            message: 'Horario fijo vacío'
          })
          continue
        }

        // Get today's date
        const today = new Date().toISOString().split('T')[0]

        // Generate all classes from start_date to today
        const generatedClasses = await generateClassesFromStartDate(
          student.id,
          student.course_id,
          fixedSchedule,
          student.start_date,
          today
        )

        // Get existing classes to avoid duplicates
        const { data: existingClasses } = await supabase
          .from('classes')
          .select('date, start_time, end_time')
          .eq('student_id', student.id)

        const existingClassKeys = new Set(
          (existingClasses || []).map(cls => `${cls.date}-${cls.start_time}-${cls.end_time}`)
        )

        // Filter out classes that already exist
        const newClasses = generatedClasses.filter(genClass => 
          !existingClassKeys.has(`${genClass.date}-${genClass.start_time}-${genClass.end_time}`)
        )

        // Insert new classes in batch
        if (newClasses.length > 0) {
          const { error: insertError } = await supabase
            .from('classes')
            .insert(newClasses)

          if (insertError) {
            console.error(`Error inserting classes for student ${student.id}:`, insertError)
            results.push({
              studentId: student.id,
              studentName: `${student.first_name} ${student.last_name}`,
              classesCreated: 0,
              error: insertError.message
            })
            continue
          }

          totalClassesCreated += newClasses.length
        }

        studentsProcessed++
        results.push({
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          classesCreated: newClasses.length,
          message: `${newClasses.length} clases creadas hasta ${today}`
        })

        console.log(`✅ Generadas ${newClasses.length} clases para ${student.first_name} ${student.last_name}`)

      } catch (error) {
        console.error(`Error processing student ${student.id}:`, error)
        results.push({
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          classesCreated: 0,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalClassesCreated,
      studentsProcessed,
      results
    })

  } catch (error) {
    console.error('Error generating missing classes:', error)
    return NextResponse.json({ 
      error: 'Error al generar clases faltantes',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}




