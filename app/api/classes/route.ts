// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Verificar si se solicitan clases específicas por IDs
    const url = new URL(request.url)
    const ids = url.searchParams.get('ids')
    const studentId = url.searchParams.get('studentId')
    const date = url.searchParams.get('date')
    const startTime = url.searchParams.get('startTime')
    
     if (ids) {
       // Obtener clases específicas por IDs
       const classIds = ids.split(',').map(id => Number(id.trim()))
       const { data: classes, error } = await supabase
         .from('classes')
         .select(`
           id,
           date,
           start_time,
           end_time,
           duration,
           subject,
           price,
           status_invoice,
           students!classes_student_id_fkey (
             first_name,
             last_name,
             email
           )
         `)
         .in('id', classIds)
         .order('date', { ascending: false })

       if (error) {
         console.error('Error fetching specific classes:', error)
         return NextResponse.json({ error: 'Error obteniendo clases específicas' }, { status: 500 })
       }

       return NextResponse.json(classes || [])
     } else if (studentId && date && startTime) {
       // Buscar clase específica por estudiante, fecha y hora
       // SOLUCIÓN ULTRA SIMPLE: Solo datos básicos, sin relaciones
       try {
         const { data: classes, error } = await supabase
           .from('classes')
           .select(`
             id,
             student_id,
             course_id,
             date,
             start_time,
             end_time,
             duration,
             day_of_week,
             is_recurring,
             status,
             payment_status,
             price,
             subject,
             notes
           `)
           .eq('student_id', studentId)
           .eq('date', date)
           .eq('start_time', startTime)
           .order('date', { ascending: false })

         if (error) {
           console.error('Error fetching specific class:', error)
           return NextResponse.json({ error: 'Error obteniendo clase específica' }, { status: 500 })
         }

         // Si necesitamos datos de estudiantes y cursos, los obtenemos por separado
         if (classes && classes.length > 0) {
           const enrichedClasses = await Promise.all(
             classes.map(async (classItem) => {
               try {
                 // Obtener datos del estudiante
                 const { data: studentData } = await supabase
                   .from('students')
                   .select('first_name, last_name, email')
                   .eq('id', classItem.student_id)
                   .single()

                 // Obtener datos del curso
                 const { data: courseData } = await supabase
                   .from('courses')
                   .select('name, color')
                   .eq('id', classItem.course_id)
                   .single()

                 return {
                   ...classItem,
                   students: studentData || { first_name: 'Unknown', last_name: 'Student', email: '' },
                   courses: courseData || { name: 'Unknown Course', color: '#000000' }
                 }
               } catch (joinError) {
                 console.error('Error in manual join for class:', classItem.id, joinError)
                 return {
                   ...classItem,
                   students: { first_name: 'Unknown', last_name: 'Student', email: '' },
                   courses: { name: 'Unknown Course', color: '#000000' }
                 }
               }
             })
           )

           return NextResponse.json(enrichedClasses)
         }

         return NextResponse.json(classes || [])
       } catch (error) {
         console.error('Error fetching specific class:', error)
         return NextResponse.json({ error: 'Error obteniendo clase específica' }, { status: 500 })
       }
    } else {
      // Obtener todas las clases (comportamiento original)
      const classes = await dbOperations.getAllClasses()
      return NextResponse.json(classes)
    }
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    
    const { student_id, course_id, start_time, end_time, duration, date, price, notes, subject } = body

    if (!student_id || !course_id || !start_time || !end_time || !duration || !date) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Calcular precio si no se proporciona
    let calculatedPrice = Number(price) || 0
    if (calculatedPrice === 0) {
      // Obtener información del curso y del estudiante para determinar el precio correcto
      const [course, student] = await Promise.all([
        dbOperations.getCourseById(Number(course_id)),
        dbOperations.getStudentById(Number(student_id))
      ])
      
      if (course && student) {
        // Usar precio compartido si el estudiante tiene has_shared_pricing: true y el curso tiene shared_class_price
        const pricePerHour = student.has_shared_pricing && course.shared_class_price
          ? course.shared_class_price
          : course.price
        
        calculatedPrice = (Number(duration) / 60) * pricePerHour
        
        console.log(`Precio calculado para clase eventual: €${calculatedPrice.toFixed(2)} (${student.has_shared_pricing ? 'compartido' : 'individual'})`)
      }
    }

    const classDataToSave = {
      student_id: Number(student_id),
      course_id: Number(course_id),
      start_time,
      end_time,
      duration: Number(duration),
      day_of_week: Number(body.day_of_week) || 1, // Use provided day_of_week or default to 1
      date,
      subject: subject || null,
      is_recurring: body.is_recurring || false, // Default to false for scheduled classes
      price: calculatedPrice,
      notes
    }
    
    
    const classId = await dbOperations.createClass(classDataToSave)

    return NextResponse.json({ id: classId, message: 'Clase creada exitosamente' })
  } catch (error: any) {
    console.error('Error creating class:', error)
    
    // Manejar error de duplicado específicamente
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      const details = error.details || ''
      let errorMessage = 'Ya existe una clase programada para este estudiante en la misma fecha y horario'
      
      // Si hay detalles sobre el conflicto, extraer información útil
      if (details.includes('student_id, date, start_time, end_time')) {
        errorMessage = 'Ya existe una clase programada para este estudiante en la misma fecha. Verifica que no haya conflictos de horario.'
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        code: error.code,
        details: error.details
      }, { status: 409 })
    }
    
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, start_time, end_time, duration, date, day_of_week, notes } = body

    if (!id || !start_time || !end_time || !duration || !date) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Obtener la clase existente para recalcular el precio
    const existingClass = await dbOperations.getClassById(Number(id))
    if (!existingClass) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Recalcular precio basado en el tipo de pricing del estudiante
    let calculatedPrice = 0
    const [course, student] = await Promise.all([
      dbOperations.getCourseById(existingClass.course_id),
      dbOperations.getStudentById(existingClass.student_id)
    ])
    
    if (course && student) {
      // Usar precio compartido si el estudiante tiene has_shared_pricing: true y el curso tiene shared_class_price
      const pricePerHour = student.has_shared_pricing && course.shared_class_price
        ? course.shared_class_price
        : course.price
      
      calculatedPrice = (Number(duration) / 60) * pricePerHour
      
      console.log(`Precio recalculado para clase actualizada: €${calculatedPrice.toFixed(2)} (${student.has_shared_pricing ? 'compartido' : 'individual'})`)
    }

    // Update the class with recalculated price
    await dbOperations.updateClass(Number(id), {
      start_time,
      end_time,
      duration: Number(duration),
      day_of_week: Number(day_of_week) || 1,
      date,
      price: calculatedPrice,
      notes: notes || null
    })

    return NextResponse.json({ message: 'Clase actualizada exitosamente' })
  } catch (error: any) {
    console.error('Error updating class:', error)
    
    // Handle duplicate key error
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      return NextResponse.json({ 
        error: 'Ya existe una clase programada para este estudiante en la misma fecha y horario',
        code: error.code
      }, { status: 409 })
    }
    
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Validar que la URL sea válida
    if (!request.url) {
      return NextResponse.json(
        { error: 'URL de request inválida' },
        { status: 400 }
      )
    }

    let searchParams
    try {
      const url = new URL(request.url)
      searchParams = url.searchParams
    } catch (urlError) {
      console.error('Error creando URL:', urlError)
      return NextResponse.json(
        { error: 'URL de request malformada' },
        { status: 400 }
      )
    }
    const ids = searchParams.get('ids')
    
    if (!ids) {
      return NextResponse.json({ error: 'IDs de clases requeridos' }, { status: 400 })
    }

    const classIds = ids.split(',').map(id => Number(id.trim()))
    
    // Eliminar cada clase
    const results = []
    for (const classId of classIds) {
      try {
        const success = await dbOperations.deleteClass(classId)
        if (success) {
          results.push({ id: classId, success: true })
        } else {
          results.push({ id: classId, success: false, error: 'No se pudo eliminar' })
        }
      } catch (error) {
        console.error(`Error deleting class ${classId}:`, error)
        results.push({ id: classId, success: false, error: error.message || 'Error desconocido' })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    if (failed > 0) {
      console.error('Some classes failed to delete:', results.filter(r => !r.success))
      return NextResponse.json({ 
        message: `${successful} clases eliminadas, ${failed} fallaron`,
        results: results
      }, { status: 207 }) // 207 Multi-Status
    }

    return NextResponse.json({ message: `${successful} clases eliminadas exitosamente` })
  } catch (error) {
    console.error('Error deleting classes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

