import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

/**
 * SOURCE OF TRUTH: Selected Classes Generation
 * 
 * This endpoint generates only the selected missing classes
 * instead of generating all missing classes automatically.
 * 
 * Features:
 * - Generates only selected classes
 * - Prevents duplicates
 * - Provides detailed results
 * - Allows partial generation
 * 
 * Used by:
 * - Frontend class comparison modal
 * - Selective class generation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { selectedClasses } = body

    if (!selectedClasses || !Array.isArray(selectedClasses) || selectedClasses.length === 0) {
      return NextResponse.json({ error: 'No se seleccionaron clases para generar' }, { status: 400 })
    }

    let totalClassesCreated = 0
    let totalClassesSkipped = 0
    const results = []
    const errors = []

    for (const classData of selectedClasses) {
      try {
        // Validate required fields
        if (!classData.student_id || !classData.course_id || !classData.date || 
            !classData.start_time || !classData.end_time) {
          errors.push({
            classData,
            error: 'Faltan campos requeridos'
          })
          continue
        }

        // Check if class already exists
        const { data: existingClass, error: checkError } = await supabase
          .from('classes')
          .select('id')
          .eq('student_id', classData.student_id)
          .eq('date', classData.date)
          .eq('start_time', classData.start_time)
          .eq('end_time', classData.end_time)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error('Error checking existing class:', checkError)
          errors.push({
            classData,
            error: 'Error al verificar clase existente'
          })
          continue
        }

        if (existingClass) {
          totalClassesSkipped++
          results.push({
            studentId: classData.student_id,
            date: classData.date,
            startTime: classData.start_time,
            status: 'skipped',
            message: 'Clase ya existe'
          })
          continue
        }

        // Insert the new class
        const { data: newClass, error: insertError } = await supabase
          .from('classes')
          .insert({
            student_id: classData.student_id,
            course_id: classData.course_id,
            start_time: classData.start_time,
            end_time: classData.end_time,
            duration: classData.duration,
            day_of_week: classData.day_of_week,
            date: classData.date,
            is_recurring: classData.is_recurring || true,
            status: 'scheduled',
            payment_status: 'unpaid',
            payment_notes: '',
            price: classData.price,
            subject: classData.subject || '',
            notes: classData.notes || 'Generado desde comparación de clases'
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Error inserting class:', insertError)
          errors.push({
            classData,
            error: insertError.message
          })
          continue
        }

        totalClassesCreated++
        results.push({
          studentId: classData.student_id,
          date: classData.date,
          startTime: classData.start_time,
          status: 'created',
          classId: newClass.id,
          message: 'Clase creada exitosamente'
        })

      } catch (error) {
        console.error('Error processing class:', error)
        errors.push({
          classData,
          error: error instanceof Error ? error.message : 'Error desconocido'
        })
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalSelected: selectedClasses.length,
        totalCreated: totalClassesCreated,
        totalSkipped: totalClassesSkipped,
        totalErrors: errors.length
      },
      results,
      errors
    })

  } catch (error) {
    console.error('Error generating selected classes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
