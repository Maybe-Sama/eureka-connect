import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateClassesFromStartDate } from '@/lib/class-generation'

/**
 * SOURCE OF TRUTH: Weekly Classes Generation
 * 
 * This is the PRIMARY endpoint for generating classes for the current week.
 * Used for automated weekly class generation.
 * 
 * Features:
 * - Generates classes for current week (Monday to Sunday)
 * - Duplicate prevention using compound key
 * - Comprehensive error handling
 * - Proper validation
 * - Batch processing
 * 
 * Used by:
 * - Weekly automation scripts
 * - Cron jobs
 * - Scheduled tasks
 */

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting weekly class generation...')
    
    // Calculate current week boundaries
    const today = new Date()
    const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate Monday of current week
    const monday = new Date(today)
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay // Handle Sunday as -6
    monday.setDate(today.getDate() + daysToMonday)
    
    // Calculate Sunday of current week
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    const weekStart = monday.toISOString().split('T')[0]
    const weekEnd = sunday.toISOString().split('T')[0]
    
    console.log(`📅 Generating classes for week: ${weekStart} to ${weekEnd}`)
    
    // Get all students with fixed_schedule and start_date
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*')
      .not('fixed_schedule', 'is', null)
      .not('start_date', 'is', null)
    
    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ 
        error: 'Error al obtener estudiantes' 
      }, { status: 500 })
    }
    
    if (!students || students.length === 0) {
      console.log('ℹ️ No students with fixed_schedule found')
      return NextResponse.json({
        success: true,
        message: 'No hay estudiantes con horario fijo',
        weekStart,
        weekEnd,
        totalClassesCreated: 0,
        studentsProcessed: 0,
        results: []
      })
    }
    
    console.log(`👥 Processing ${students.length} students with fixed schedules`)
    
    let totalClassesCreated = 0
    let studentsProcessed = 0
    const results = []
    
    for (const student of students) {
      try {
        // Skip students with future start dates
        if (student.start_date > weekEnd) {
          results.push({
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            classesCreated: 0,
            message: 'Fecha de inicio en el futuro'
          })
          continue
        }
        
        // Parse fixed_schedule
        const fixedSchedule = typeof student.fixed_schedule === 'string' 
          ? JSON.parse(student.fixed_schedule) 
          : student.fixed_schedule
        
        if (!Array.isArray(fixedSchedule) || fixedSchedule.length === 0) {
          results.push({
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            classesCreated: 0,
            message: 'Horario fijo inválido o vacío'
          })
          continue
        }
        
        // Generate classes for the current week only
        const generatedClasses = await generateClassesFromStartDate(
          student.id,
          student.course_id,
          fixedSchedule,
          Math.max(student.start_date, weekStart), // Don't go before student's start date
          weekEnd
        )
        
        if (generatedClasses.length === 0) {
          results.push({
            studentId: student.id,
            studentName: `${student.first_name} ${student.last_name}`,
            classesCreated: 0,
            message: 'No se generaron clases para esta semana'
          })
          continue
        }
        
        // Get existing classes for this student to avoid duplicates
        const { data: existingClasses } = await supabase
          .from('classes')
          .select('date, start_time, end_time')
          .eq('student_id', student.id)
          .gte('date', weekStart)
          .lte('date', weekEnd)
        
        const existingClassKeys = new Set(
          (existingClasses || []).map(cls => `${cls.date}-${cls.start_time}-${cls.end_time}`)
        )
        
        // Filter out classes that already exist
        const newClasses = generatedClasses.filter(genClass => 
          !existingClassKeys.has(`${genClass.date}-${genClass.start_time}-${genClass.end_time}`)
        )
        
        // Insert new classes if any
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
          console.log(`✅ Generated ${newClasses.length} classes for ${student.first_name} ${student.last_name}`)
        }
        
        studentsProcessed++
        results.push({
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          classesCreated: newClasses.length,
          message: `${newClasses.length} clases creadas para la semana ${weekStart} a ${weekEnd}`
        })
        
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
    
    console.log(`🎉 Weekly class generation completed: ${totalClassesCreated} classes created for ${studentsProcessed} students`)
    
    return NextResponse.json({
      success: true,
      message: `Generación semanal completada: ${totalClassesCreated} clases creadas`,
      weekStart,
      weekEnd,
      totalClassesCreated,
      studentsProcessed,
      results
    })
    
  } catch (error) {
    console.error('Error in weekly class generation:', error)
    return NextResponse.json({ 
      error: 'Error al generar clases semanales',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to check the status of weekly class generation
 * Useful for monitoring and debugging
 */
export async function GET() {
  try {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    const daysToMonday = currentDay === 0 ? -6 : 1 - currentDay
    monday.setDate(today.getDate() + daysToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    
    const weekStart = monday.toISOString().split('T')[0]
    const weekEnd = sunday.toISOString().split('T')[0]
    
    // Get count of students with fixed schedules
    const { data: students, error } = await supabase
      .from('students')
      .select('id')
      .not('fixed_schedule', 'is', null)
      .not('start_date', 'is', null)
    
    if (error) {
      return NextResponse.json({ error: 'Error fetching students' }, { status: 500 })
    }
    
    // Get count of existing classes for this week
    const { data: existingClasses, error: classesError } = await supabase
      .from('classes')
      .select('id')
      .gte('date', weekStart)
      .lte('date', weekEnd)
    
    if (classesError) {
      return NextResponse.json({ error: 'Error fetching classes' }, { status: 500 })
    }
    
    return NextResponse.json({
      weekStart,
      weekEnd,
      studentsWithFixedSchedule: students?.length || 0,
      existingClassesThisWeek: existingClasses?.length || 0,
      status: 'ready'
    })
    
  } catch (error) {
    console.error('Error checking weekly generation status:', error)
    return NextResponse.json({ 
      error: 'Error al verificar el estado de generación semanal' 
    }, { status: 500 })
  }
}
