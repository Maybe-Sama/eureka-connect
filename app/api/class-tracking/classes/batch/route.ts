// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { updates } = body

    console.log('Batch update received:', { updates, body })

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      console.error('No updates provided or empty array')
      return NextResponse.json({ error: 'No se proporcionaron actualizaciones' }, { status: 400 })
    }

    const updatedClasses: any[] = []
    const errors: string[] = []

    // Process each update
    for (const update of updates) {
      const { classId, ...updateData } = update

      console.log(`Processing update for class ${classId}:`, updateData)

      if (!classId) {
        console.warn('Update sin classId, saltando:', update)
        errors.push(`Update sin classId: ${JSON.stringify(update)}`)
        continue
      }

      // Validate update data
      const allowedFields = ['status', 'payment_status', 'subject', 'payment_notes']
      const filteredUpdateData: any = {}
      
      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== '' && value !== null && value !== undefined) {
          filteredUpdateData[key] = value
        }
      }

      console.log(`Filtered update data for class ${classId}:`, filteredUpdateData)

      // Skip if no valid fields to update
      if (Object.keys(filteredUpdateData).length === 0) {
        console.warn(`No hay campos válidos para actualizar en clase ${classId}`)
        errors.push(`No hay campos válidos para actualizar en clase ${classId}`)
        continue
      }

      // Add updated_at timestamp
      filteredUpdateData.updated_at = new Date().toISOString()

      console.log(`Final update data for class ${classId}:`, filteredUpdateData)

      // Update the class
      // @ts-ignore - Supabase type inference issue
      const { data: updatedClass, error } = await supabase
        .from('classes')
        .update(filteredUpdateData)
        .eq('id', classId)
        .select(`
          id,
          student_id,
          course_id,
          start_time,
          end_time,
          duration,
          day_of_week,
          date,
          subject,
          is_recurring,
          status,
          payment_status,
          price,
          notes,
          payment_date,
          payment_notes,
          students!classes_student_id_fkey(first_name, last_name, email),
          courses(name, price, color)
        `)
        .single()

      if (error) {
        console.error(`Error actualizando clase ${classId}:`, error)
        errors.push(`Error actualizando clase ${classId}: ${error.message}`)
        continue
      }

      if (updatedClass) {
        updatedClasses.push(updatedClass)
        console.log(`Successfully updated class ${classId}`)
      }
    }

    console.log(`Batch update completed. Updated: ${updatedClasses.length}, Errors: ${errors.length}`)

    if (updatedClasses.length === 0) {
      return NextResponse.json({ 
        error: 'No se pudo actualizar ninguna clase',
        details: errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      updatedClasses,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error en batch update:', error)
    return NextResponse.json({ 
      error: 'Error al actualizar las clases',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
