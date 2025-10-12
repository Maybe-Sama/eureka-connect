import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
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
    const studentId = searchParams.get('studentId')
    const monthYear = searchParams.get('month') || new Date().toISOString().slice(0, 7)
    const classType = searchParams.get('type') // 'recurring', 'eventual', or null for all

    if (!studentId) {
      return NextResponse.json({ error: 'studentId es requerido' }, { status: 400 })
    }

    // Get student info including start_date and fixed_schedule
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('first_name, last_name, email, course_id, start_date, fixed_schedule, has_shared_pricing')
      .eq('id', studentId)
      .single()

    if (studentError) {
      console.error('Error fetching student info:', studentError)
      return NextResponse.json({ error: 'Error al obtener información del estudiante' }, { status: 500 })
    }

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Validate student has start_date
    if (!student.start_date) {
      console.warn(`Student ${studentId} has no start_date, using default`)
      return NextResponse.json([])
    }

    // Validate start_date is not in the future
    if (student.start_date > today) {
      console.warn(`Student ${studentId} start_date is in the future`)
      return NextResponse.json([])
    }

    // CRITICAL: Always use student's start_date as the absolute minimum
    const startDate = student.start_date

    // Calculate date range based on month parameter
    // If month is provided (YYYY-MM format), filter by that month
    // Otherwise, show all classes from start_date to today
    let queryStartDate = startDate
    let queryEndDate = today

    if (monthYear && monthYear.match(/^\d{4}-\d{2}$/)) {
      // Parse month year (YYYY-MM)
      const [year, month] = monthYear.split('-').map(Number)
      
      // First day of the month
      const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
      
      // Last day of the month (using UTC to avoid timezone issues)
      const nextMonth = month === 12 ? 1 : month + 1
      const nextYear = month === 12 ? year + 1 : year
      const lastDayOfMonth = new Date(Date.UTC(nextYear, nextMonth - 1, 0)).getUTCDate()
      const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDayOfMonth).padStart(2, '0')}`
      
      // Use the later of: student's start_date OR first day of month
      queryStartDate = startDate > monthStart ? startDate : monthStart
      
      // Use the earlier of: today OR last day of month
      queryEndDate = today < monthEnd ? today : monthEnd
    }

    // Show classes within the calculated date range
    let query = supabase
      .from('classes')
      .select('*')
      .eq('student_id', studentId)
      .gte('date', queryStartDate)
      .lte('date', queryEndDate)
      .order('date', { ascending: false })
      .order('start_time')
    
    if (classType) {
      if (classType === 'recurring') {
        query = query.eq('is_recurring', true)
      } else if (classType === 'eventual') {
        query = query.eq('is_recurring', false)
      }
    }

    const { data: classes, error } = await query

    if (error) {
      console.error('Error fetching student classes:', error)
      return NextResponse.json({ error: 'Error al obtener las clases del estudiante' }, { status: 500 })
    }

    console.log(`Found ${classes?.length || 0} classes for student ${studentId} from ${queryStartDate} to ${queryEndDate}`)

    // Get course info
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('name, price, shared_class_price, color')
      .eq('id', student.course_id)
      .single()

    if (courseError) {
      console.error('Error fetching course info:', courseError)
      return NextResponse.json({ error: 'Error al obtener información del curso' }, { status: 500 })
    }

    // If no classes found, return empty array (don't throw error)
    if (!classes || classes.length === 0) {
      console.warn(`No classes found for student ${studentId}. This might indicate missing data.`)
      return NextResponse.json([])
    }

    // Add student and course info to each class
    const classesWithInfo = classes.map(cls => ({
      ...cls,
      students: {
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email,
        start_date: student.start_date,
        has_shared_pricing: student.has_shared_pricing || false
      },
      courses: {
        name: course.name,
        price: course.price,
        shared_class_price: course.shared_class_price || null,
        color: course.color
      }
    }))
    
    return NextResponse.json(classesWithInfo)
  } catch (error) {
    console.error('Error fetching student classes:', error)
    return NextResponse.json({ error: 'Error al obtener las clases del estudiante' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, status, paymentStatus, paymentNotes, payment_status, payment_notes, subject } = body

    if (!classId) {
      return NextResponse.json({ error: 'classId es requerido' }, { status: 400 })
    }

    // Use the correct field names from frontend
    const finalPaymentStatus = paymentStatus || payment_status
    const finalPaymentNotes = paymentNotes || payment_notes

    // Validate status
    if (status && !['scheduled', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json({ error: 'Estado de clase inválido' }, { status: 400 })
    }

    // Validate payment status
    if (finalPaymentStatus && !['unpaid', 'paid'].includes(finalPaymentStatus)) {
      return NextResponse.json({ error: 'Estado de pago inválido' }, { status: 400 })
    }

    // Build update object
    const updateData: any = {}
    
    if (status) {
      updateData.status = status
    }

    if (finalPaymentStatus) {
      updateData.payment_status = finalPaymentStatus
      updateData.payment_date = finalPaymentStatus === 'paid' ? new Date().toISOString() : null
    }

    if (finalPaymentNotes !== undefined) {
      updateData.payment_notes = finalPaymentNotes
    }

    if (subject !== undefined) {
      updateData.subject = subject
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    const { data: updatedClass, error } = await supabase
      .from('classes')
      .update(updateData)
      .eq('id', classId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating class:', error)
      return NextResponse.json({ error: 'Error al actualizar la clase' }, { status: 500 })
    }

    if (!updatedClass) {
      return NextResponse.json({ error: 'Clase no encontrada' }, { status: 404 })
    }

    // Get student and course info
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('first_name, last_name, email, course_id')
      .eq('id', updatedClass.student_id)
      .single()

    if (studentError) {
      console.error('Error fetching student info:', studentError)
      return NextResponse.json({ error: 'Error al obtener información del estudiante' }, { status: 500 })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('name, price, color')
      .eq('id', student.course_id)
      .single()

    if (courseError) {
      console.error('Error fetching course info:', courseError)
      return NextResponse.json({ error: 'Error al obtener información del curso' }, { status: 500 })
    }

    // Add student and course info to the updated class
    const classWithInfo = {
      ...updatedClass,
      students: {
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email
      },
      courses: {
        name: course.name,
        price: course.price,
        color: course.color
      }
    }

    return NextResponse.json(classWithInfo)
  } catch (error) {
    console.error('Error updating class:', error)
    return NextResponse.json({ error: 'Error al actualizar la clase' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, courseId, startTime, endTime, duration, dayOfWeek, date, subject, isRecurring, price, notes } = body

    if (!studentId || !courseId || !startTime || !endTime || !duration || !date || !price) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    // Insert new class
    const { data: newClass, error } = await supabase
      .from('classes')
      .insert({
        student_id: studentId,
        course_id: courseId,
        start_time: startTime,
        end_time: endTime,
        duration: duration,
        day_of_week: dayOfWeek,
        date: date,
        subject: subject || null,
        is_recurring: isRecurring || false,
        status: 'scheduled',
        payment_status: 'unpaid',
        price: price,
        notes: notes || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating class:', error)
      return NextResponse.json({ error: 'Error al crear la clase' }, { status: 500 })
    }

    // Get student and course info to add to the response
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('first_name, last_name, email, course_id')
      .eq('id', studentId)
      .single()

    if (studentError) {
      console.error('Error fetching student info:', studentError)
      return NextResponse.json({ error: 'Error al obtener información del estudiante' }, { status: 500 })
    }

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('name, price, color')
      .eq('id', courseId)
      .single()

    if (courseError) {
      console.error('Error fetching course info:', courseError)
      return NextResponse.json({ error: 'Error al obtener información del curso' }, { status: 500 })
    }

    // Add student and course info to the new class
    const classWithInfo = {
      ...newClass,
      students: {
        first_name: student.first_name,
        last_name: student.last_name,
        email: student.email
      },
      courses: {
        name: course.name,
        price: course.price,
        color: course.color
      }
    }

    // Update tracking for the student's month
    const monthYear = date.slice(0, 7) // YYYY-MM format
    // await dbOperations.generateStudentMonthlyTracking(studentId, monthYear)

    return NextResponse.json(classWithInfo)
  } catch (error) {
    console.error('Error creating class:', error)
    return NextResponse.json({ error: 'Error al crear la clase' }, { status: 500 })
  }
}
