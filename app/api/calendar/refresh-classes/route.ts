import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'
import { supabase } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🔄 Iniciando refresco de clases desde horarios fijos...')
    
    // Obtener todos los estudiantes con horarios fijos
    const students = await dbOperations.getAllStudents()
    const studentsWithFixedSchedule = students.filter(student => 
      student.fixed_schedule && student.fixed_schedule.trim() !== ''
    )
    
    console.log(`📚 Encontrados ${studentsWithFixedSchedule.length} estudiantes con horarios fijos`)
    
    let classesCreated = 0
    let errors = 0
    
    for (const student of studentsWithFixedSchedule) {
      try {
        // Parsear el horario fijo
        const fixedSchedule = JSON.parse(student.fixed_schedule)
        
        if (!Array.isArray(fixedSchedule)) {
          console.log(`⚠️ Horario fijo inválido para estudiante ${student.id}`)
          continue
        }
        
        // Verificar si ya existen clases para este estudiante (usar consulta directa)
        const { data: existingClasses, error: classesError } = await supabase
          .from('classes')
          .select('id')
          .eq('student_id', student.id)
        
        if (classesError) {
          console.log(`⚠️ Error verificando clases para estudiante ${student.id}:`, classesError)
          continue
        }
        
        const studentClasses = existingClasses || []
        
        if (studentClasses.length > 0) {
          console.log(`ℹ️ Estudiante ${student.id} ya tiene ${studentClasses.length} clases, saltando...`)
          continue
        }
        
        // Obtener información del curso
        const course = await dbOperations.getCourseById(student.course_id)
        if (!course) {
          console.log(`⚠️ Curso no encontrado para estudiante ${student.id}`)
          continue
        }
        
        // Crear clases para cada slot del horario fijo
        for (const timeSlot of fixedSchedule) {
          const startMinutes = timeToMinutes(timeSlot.start_time)
          const endMinutes = timeToMinutes(timeSlot.end_time)
          const duration = endMinutes - startMinutes
          const price = (duration / 60) * course.price
          
          // Calcular la próxima fecha para este día de la semana
          const nextDate = getNextOccurrence(timeSlot.day_of_week)
          
          // Convert day_of_week from 0-6 format to 1-7 format
          const dayOfWeekConverted = timeSlot.day_of_week === 0 ? 7 : timeSlot.day_of_week
          
          await dbOperations.createClass({
            student_id: student.id,
            course_id: student.course_id,
            start_time: timeSlot.start_time,
            end_time: timeSlot.end_time,
            duration,
            day_of_week: dayOfWeekConverted,
            date: nextDate,
            subject: timeSlot.subject || null,
            is_recurring: true,
            price,
            notes: `Horario fijo generado automáticamente - Día ${dayOfWeekConverted}`
          })
          
          classesCreated++
        }
        
        console.log(`✅ Clases generadas para estudiante ${student.first_name} ${student.last_name}`)
        
      } catch (error) {
        console.error(`❌ Error procesando estudiante ${student.id}:`, error)
        errors++
      }
    }
    
    console.log(`🎉 Refresco completado: ${classesCreated} clases creadas, ${errors} errores`)
    
    return NextResponse.json({
      success: true,
      message: `Refresco completado: ${classesCreated} clases generadas para ${studentsWithFixedSchedule.length} estudiantes`,
      classesCreated,
      studentsProcessed: studentsWithFixedSchedule.length,
      errors
    })
    
  } catch (error) {
    console.error('❌ Error en refresco de clases:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Error interno del servidor durante el refresco' 
      }, 
      { status: 500 }
    )
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


