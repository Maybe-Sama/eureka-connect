import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { generateClassesFromStartDate } from '@/lib/class-generation'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const monthYear = searchParams.get('month') || new Date().toISOString().slice(0, 7) // YYYY-MM format
    const studentId = searchParams.get('studentId')

    console.log(`Fetching class tracking for month: ${monthYear}`)

    // Get all students with their courses
    let studentsQuery = supabase
      .from('students')
      .select(`
        id,
        first_name,
        last_name,
        email,
        course_id,
        start_date,
        fixed_schedule,
        has_shared_pricing,
        courses(name, price, shared_class_price, color)
      `)
    
    if (studentId) {
      studentsQuery = studentsQuery.eq('id', studentId)
    }

    const { data: students, error: studentsError } = await studentsQuery

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Error al obtener estudiantes' }, { status: 500 })
    }

    console.log(`Found ${students?.length || 0} students`)

    if (!students || students.length === 0) {
      console.log('No students found')
      return NextResponse.json([])
    }

    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]
    const currentYear = today.split('-')[0]
    const currentMonth = today.split('-')[1]

    // For each student, get their classes and calculate stats
    const trackingData = []
    let skippedStudents = []
    
    for (const student of students) {
      // Validate student has required fields
      if (!student.start_date || !student.fixed_schedule) {
        console.warn(`⚠️ Skipping student ${student.id} (${student.first_name} ${student.last_name}): missing start_date or fixed_schedule`)
        skippedStudents.push({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          course: (student.courses as any)?.name || 'Sin curso',
          reason: 'missing start_date or fixed_schedule'
        })
        continue
      }

      // Skip students with future start dates
      if (student.start_date > today) {
        console.warn(`⚠️ Skipping student ${student.id} (${student.first_name} ${student.last_name}): start_date is in the future (${student.start_date})`)
        skippedStudents.push({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          course: (student.courses as any)?.name || 'Sin curso',
          reason: `start_date in future: ${student.start_date}`
        })
        continue
      }
      
      // Parse and validate fixed_schedule
      let fixedSchedule = null
      try {
        fixedSchedule = typeof student.fixed_schedule === 'string' 
          ? JSON.parse(student.fixed_schedule) 
          : student.fixed_schedule
        
        if (!Array.isArray(fixedSchedule) || fixedSchedule.length === 0) {
          console.warn(`⚠️ Skipping student ${student.id} (${student.first_name} ${student.last_name}): invalid or empty fixed_schedule`)
          skippedStudents.push({
            id: student.id,
            name: `${student.first_name} ${student.last_name}`,
            course: (student.courses as any)?.name || 'Sin curso',
            reason: 'invalid or empty fixed_schedule'
          })
          continue
        }
      } catch (error) {
        console.error(`⚠️ Skipping student ${student.id} (${student.first_name} ${student.last_name}): error parsing fixed_schedule`, error)
        skippedStudents.push({
          id: student.id,
          name: `${student.first_name} ${student.last_name}`,
          course: (student.courses as any)?.name || 'Sin curso',
          reason: 'error parsing fixed_schedule'
        })
        continue
      }

      // Calculate date range for the selected month
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
      const queryStartDate = student.start_date > monthStart ? student.start_date : monthStart
      
      // Use the earlier of: today OR last day of month
      const queryEndDate = today < monthEnd ? today : monthEnd
      
      // Query classes ONLY for the selected month
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('student_id', student.id)
        .gte('date', queryStartDate)
        .lte('date', queryEndDate)

      if (classesError) {
        console.error(`Error fetching classes for student ${student.id}:`, classesError)
        continue
      }

      // Use only existing classes from database
      // DO NOT generate classes here - that should only happen when user clicks "Update Classes"
      const classesArray = classes || []
      
      // Calculate statistics
      const stats = {
        student_id: student.id,
        course_id: student.course_id,
        month_year: monthYear,
        students: {
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          start_date: student.start_date,
          has_shared_pricing: student.has_shared_pricing || false
        },
        courses: {
          name: (student.courses as any)?.name || 'Curso no encontrado',
          price: (student.courses as any)?.price || 0,
          shared_class_price: (student.courses as any)?.shared_class_price || null,
          color: (student.courses as any)?.color || '#000000'
        },
        total_classes_scheduled: classesArray.length,
        total_classes_completed: classesArray.filter(c => c.status === 'completed').length,
        total_classes_cancelled: classesArray.filter(c => c.status === 'cancelled').length,
        recurring_classes_scheduled: classesArray.filter(c => c.is_recurring).length,
        recurring_classes_completed: classesArray.filter(c => c.is_recurring && c.status === 'completed').length,
        recurring_classes_cancelled: classesArray.filter(c => c.is_recurring && c.status === 'cancelled').length,
        eventual_classes_scheduled: classesArray.filter(c => !c.is_recurring).length,
        eventual_classes_completed: classesArray.filter(c => !c.is_recurring && c.status === 'completed').length,
        eventual_classes_cancelled: classesArray.filter(c => !c.is_recurring && c.status === 'cancelled').length,
        classes_paid: classesArray.filter(c => c.payment_status === 'paid').length,
        classes_unpaid: classesArray.filter(c => c.payment_status === 'unpaid').length,
        recurring_classes_paid: classesArray.filter(c => c.is_recurring && c.payment_status === 'paid').length,
        recurring_classes_unpaid: classesArray.filter(c => c.is_recurring && c.payment_status === 'unpaid').length,
        eventual_classes_paid: classesArray.filter(c => !c.is_recurring && c.payment_status === 'paid').length,
        eventual_classes_unpaid: classesArray.filter(c => !c.is_recurring && c.payment_status === 'unpaid').length,
      }

      // Calculate earnings based on NON-CANCELLED classes
      // Total earned = sum of prices for scheduled and completed classes (NOT cancelled)
      const nonCancelledClasses = classesArray.filter(c => c.status !== 'cancelled')
      const totalEarned = nonCancelledClasses.reduce((sum, c) => sum + (c.price || 0), 0)
      
      // Total paid = sum of prices for non-cancelled classes marked as 'paid'
      const totalPaid = nonCancelledClasses
        .filter(c => c.payment_status === 'paid')
        .reduce((sum, c) => sum + (c.price || 0), 0)
      
      const totalUnpaid = totalEarned - totalPaid

      // Recurring earnings (excluding cancelled)
      const recurringClasses = classesArray.filter(c => c.is_recurring && c.status !== 'cancelled')
      const recurringEarned = recurringClasses.reduce((sum, c) => sum + (c.price || 0), 0)
      const recurringPaid = recurringClasses
        .filter(c => c.payment_status === 'paid')
        .reduce((sum, c) => sum + (c.price || 0), 0)
      const recurringUnpaid = recurringEarned - recurringPaid

      // Eventual earnings (excluding cancelled)
      const eventualClasses = classesArray.filter(c => !c.is_recurring && c.status !== 'cancelled')
      const eventualEarned = eventualClasses.reduce((sum, c) => sum + (c.price || 0), 0)
      const eventualPaid = eventualClasses
        .filter(c => c.payment_status === 'paid')
        .reduce((sum, c) => sum + (c.price || 0), 0)
      const eventualUnpaid = eventualEarned - eventualPaid

      trackingData.push({
        ...stats,
        total_earned: totalEarned,
        total_paid: totalPaid,
        total_unpaid: totalUnpaid,
        recurring_earned: recurringEarned,
        recurring_paid: recurringPaid,
        recurring_unpaid: recurringUnpaid,
        eventual_earned: eventualEarned,
        eventual_paid: eventualPaid,
        eventual_unpaid: eventualUnpaid,
      })
    }

    console.log(`Returning ${trackingData.length} students with tracking data`)
    
    if (skippedStudents.length > 0) {
      console.warn(`⚠️ Skipped ${skippedStudents.length} students:`)
      skippedStudents.forEach(s => {
        console.warn(`  - ${s.name} (${s.course}): ${s.reason}`)
      })
    }
    
    return NextResponse.json(trackingData)
  } catch (error) {
    console.error('Error fetching class tracking:', error)
    return NextResponse.json({ error: 'Error al obtener el seguimiento de clases' }, { status: 500 })
  }
}
