// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

// Configurar la ruta como dinámica para evitar errores de SSG
export const dynamic = 'force-dynamic'

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
    const monthYear = searchParams.get('month') || new Date().toISOString().slice(0, 7)

    // Get monthly report
    const { data: report, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('month_year', monthYear)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching monthly report:', error)
      return NextResponse.json({ error: 'Error al obtener el reporte mensual' }, { status: 500 })
    }

    if (!report) {
      // Generate report if it doesn't exist
      await generateMonthlyReport(monthYear)
      const { data: newReport, error: newError } = await supabase
        .from('monthly_reports')
        .select('*')
        .eq('month_year', monthYear)
        .single()

      if (newError) {
        console.error('Error fetching generated report:', newError)
        return NextResponse.json({ error: 'Error al generar el reporte mensual' }, { status: 500 })
      }

      return NextResponse.json(newReport)
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching monthly report:', error)
    return NextResponse.json({ error: 'Error al obtener el reporte mensual' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { monthYear } = body

    if (!monthYear) {
      return NextResponse.json({ error: 'monthYear es requerido' }, { status: 400 })
    }

    // Generate report for the specified month
    await generateMonthlyReport(monthYear)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error generating monthly report:', error)
    return NextResponse.json({ error: 'Error al generar el reporte mensual' }, { status: 500 })
  }
}

async function generateMonthlyReport(monthYear: string) {
  // Get all students
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id')

  if (studentsError) {
    console.error('Error fetching students:', studentsError)
    throw new Error('Error al obtener estudiantes')
  }

  if (!students || students.length === 0) {
    console.log('No students found')
    return
  }

  // Generate tracking for each student
  for (const student of students) {
    try {
      await generateStudentMonthlyTracking(student.id, monthYear)
    } catch (error) {
      console.error(`Error generating tracking for student ${student.id}:`, error)
      // Continue with next student instead of failing completely
    }
  }

  // Get aggregated data
  const { data: trackingData, error: trackingError } = await supabase
    .from('class_tracking')
    .select('*')
    .eq('month_year', monthYear)

  if (trackingError) {
    throw new Error('Error al obtener datos de seguimiento')
  }

  const aggregated = trackingData.reduce((acc, item) => ({
    total_students: acc.total_students + 1,
    total_classes_scheduled: acc.total_classes_scheduled + item.total_classes_scheduled,
    total_classes_completed: acc.total_classes_completed + item.total_classes_completed,
    total_classes_cancelled: acc.total_classes_cancelled + item.total_classes_cancelled,
    total_recurring_classes: acc.total_recurring_classes + item.recurring_classes_scheduled,
    total_eventual_classes: acc.total_eventual_classes + item.eventual_classes_scheduled,
    total_earned: acc.total_earned + item.total_earned,
    total_paid: acc.total_paid + item.total_paid,
    total_unpaid: acc.total_unpaid + item.total_unpaid,
  }), {
    total_students: 0,
    total_classes_scheduled: 0,
    total_classes_completed: 0,
    total_classes_cancelled: 0,
    total_recurring_classes: 0,
    total_eventual_classes: 0,
    total_earned: 0,
    total_paid: 0,
    total_unpaid: 0,
  })

  const averageEarnedPerStudent = aggregated.total_students > 0 ? aggregated.total_earned / aggregated.total_students : 0

  // Insert or update monthly report
  const { error: upsertError } = await supabase
    .from('monthly_reports')
    .upsert({
      month_year: monthYear,
      total_students: aggregated.total_students,
      total_classes_scheduled: aggregated.total_classes_scheduled,
      total_classes_completed: aggregated.total_classes_completed,
      total_classes_cancelled: aggregated.total_classes_cancelled,
      total_recurring_classes: aggregated.total_recurring_classes,
      total_eventual_classes: aggregated.total_eventual_classes,
      total_earned: aggregated.total_earned,
      total_paid: aggregated.total_paid,
      total_unpaid: aggregated.total_unpaid,
      average_earned_per_student: averageEarnedPerStudent,
    }, {
      onConflict: 'month_year'
    })

  if (upsertError) {
    throw new Error('Error al actualizar el reporte mensual')
  }
}

// Import the function from the main route
async function generateStudentMonthlyTracking(studentId: number, monthYear: string) {
  // Get student info
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('*')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    throw new Error('Estudiante no encontrado')
  }

  const courseId = student.course_id

  // Get all classes for the student in the specified month
  // Calculate the first day of the next month for the upper bound
  const [year, month] = monthYear.split('-').map(Number)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  // Use the later of: first day of month OR student's start_date
  const monthStartDate = `${monthYear}-01`
  const queryStartDate = student.start_date && student.start_date > monthStartDate 
    ? student.start_date 
    : monthStartDate

  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('*')
    .eq('student_id', studentId)
    .gte('date', queryStartDate)
    .lt('date', nextMonthStr)

  if (classesError) {
    throw new Error('Error al obtener las clases')
  }

  // Calculate statistics
  const stats = {
    total_classes_scheduled: classes.length,
    total_classes_completed: classes.filter(c => c.status === 'completed').length,
    total_classes_cancelled: classes.filter(c => c.status === 'cancelled').length,
    recurring_classes_scheduled: classes.filter(c => c.is_recurring).length,
    recurring_classes_completed: classes.filter(c => c.is_recurring && c.status === 'completed').length,
    recurring_classes_cancelled: classes.filter(c => c.is_recurring && c.status === 'cancelled').length,
    eventual_classes_scheduled: classes.filter(c => !c.is_recurring).length,
    eventual_classes_completed: classes.filter(c => !c.is_recurring && c.status === 'completed').length,
    eventual_classes_cancelled: classes.filter(c => !c.is_recurring && c.status === 'cancelled').length,
    classes_paid: classes.filter(c => c.payment_status === 'paid').length,
    classes_unpaid: classes.filter(c => c.payment_status === 'unpaid').length,
    recurring_classes_paid: classes.filter(c => c.is_recurring && c.payment_status === 'paid').length,
    recurring_classes_unpaid: classes.filter(c => c.is_recurring && c.payment_status === 'unpaid').length,
    eventual_classes_paid: classes.filter(c => !c.is_recurring && c.payment_status === 'paid').length,
    eventual_classes_unpaid: classes.filter(c => !c.is_recurring && c.payment_status === 'unpaid').length,
  }

  // Calculate earnings
  const completedClasses = classes.filter(c => c.status === 'completed')
  const totalEarned = completedClasses.reduce((sum, c) => sum + c.price, 0)
  const totalPaid = completedClasses.filter(c => c.payment_status === 'paid').reduce((sum, c) => sum + c.price, 0)
  const totalUnpaid = totalEarned - totalPaid

  const recurringCompleted = completedClasses.filter(c => c.is_recurring)
  const recurringEarned = recurringCompleted.reduce((sum, c) => sum + c.price, 0)
  const recurringPaid = recurringCompleted.filter(c => c.payment_status === 'paid').reduce((sum, c) => sum + c.price, 0)
  const recurringUnpaid = recurringEarned - recurringPaid

  const eventualCompleted = completedClasses.filter(c => !c.is_recurring)
  const eventualEarned = eventualCompleted.reduce((sum, c) => sum + c.price, 0)
  const eventualPaid = eventualCompleted.filter(c => c.payment_status === 'paid').reduce((sum, c) => sum + c.price, 0)
  const eventualUnpaid = eventualEarned - eventualPaid

  // Insert or update tracking record
  const { error: upsertError } = await supabase
    .from('class_tracking')
    .upsert({
      student_id: studentId,
      course_id: courseId,
      month_year: monthYear,
      total_classes_scheduled: stats.total_classes_scheduled,
      total_classes_completed: stats.total_classes_completed,
      total_classes_cancelled: stats.total_classes_cancelled,
      recurring_classes_scheduled: stats.recurring_classes_scheduled,
      recurring_classes_completed: stats.recurring_classes_completed,
      recurring_classes_cancelled: stats.recurring_classes_cancelled,
      eventual_classes_scheduled: stats.eventual_classes_scheduled,
      eventual_classes_completed: stats.eventual_classes_completed,
      eventual_classes_cancelled: stats.eventual_classes_cancelled,
      classes_paid: stats.classes_paid,
      classes_unpaid: stats.classes_unpaid,
      recurring_classes_paid: stats.recurring_classes_paid,
      recurring_classes_unpaid: stats.recurring_classes_unpaid,
      eventual_classes_paid: stats.eventual_classes_paid,
      eventual_classes_unpaid: stats.eventual_classes_unpaid,
      total_earned: totalEarned,
      total_paid: totalPaid,
      total_unpaid: totalUnpaid,
      recurring_earned: recurringEarned,
      recurring_paid: recurringPaid,
      recurring_unpaid: recurringUnpaid,
      eventual_earned: eventualEarned,
      eventual_paid: eventualPaid,
      eventual_unpaid: eventualUnpaid,
    }, {
      onConflict: 'student_id,month_year'
    })

  if (upsertError) {
    throw new Error('Error al actualizar el seguimiento')
  }
}

