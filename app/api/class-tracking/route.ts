import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
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
        courses(name, price, color)
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
    
    for (const student of students) {
      // Validate student has required fields
      if (!student.start_date || !student.fixed_schedule) {
        console.warn(`Skipping student ${student.id}: missing start_date or fixed_schedule`)
        continue
      }

      // Skip students with future start dates
      if (student.start_date > today) {
        console.warn(`Skipping student ${student.id}: start_date is in the future`)
        continue
      }
      
      // Parse and validate fixed_schedule
      let fixedSchedule = null
      try {
        fixedSchedule = typeof student.fixed_schedule === 'string' 
          ? JSON.parse(student.fixed_schedule) 
          : student.fixed_schedule
        
        if (!Array.isArray(fixedSchedule) || fixedSchedule.length === 0) {
          console.warn(`Skipping student ${student.id}: invalid or empty fixed_schedule`)
          continue
        }
      } catch (error) {
        console.error(`Skipping student ${student.id}: error parsing fixed_schedule`, error)
        continue
      }

      // Calculate date range for queries
      // IMPORTANT: Use student's start_date as the absolute minimum, not the month start
      const monthStartDate = new Date(`${monthYear}-01`)
      const studentStartDate = new Date(student.start_date)
      const queryStartDate = studentStartDate > monthStartDate 
        ? student.start_date 
        : `${monthYear}-01`
      
      // Query classes from the calculated start date to today
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('student_id', student.id)
        .gte('date', queryStartDate)
        .lte('date', today)

      if (classesError) {
        console.error(`Error fetching classes for student ${student.id}:`, classesError)
        continue
      }

      let classesArray = classes || []
      
      // Generate missing classes from student's start date (not just this month)
      try {
        // Generate all classes from start date to today
        const generatedClasses = await generateClassesFromStartDate(
          student.id, 
          student.course_id, 
          fixedSchedule, 
          student.start_date, 
          today
        )
        
        // Merge with existing classes, avoiding duplicates
        const existingClassKeys = new Set(
          classesArray.map(cls => `${cls.date}-${cls.start_time}-${cls.end_time}`)
        )
        
        const newClasses = generatedClasses.filter(genClass => 
          !existingClassKeys.has(`${genClass.date}-${genClass.start_time}-${genClass.end_time}`)
        )
        
        // Only merge classes that fall within the query date range
        const newClassesInRange = newClasses.filter(cls => 
          cls.date >= queryStartDate && cls.date <= today
        )
        
        classesArray = [...classesArray, ...newClassesInRange]
        
        if (newClassesInRange.length > 0) {
          console.log(`Generated ${newClassesInRange.length} missing classes for student ${student.id}`)
        }
      } catch (error) {
        console.error(`Error generating classes for student ${student.id}:`, error)
      }
      
      // Calculate statistics
      const stats = {
        student_id: student.id,
        course_id: student.course_id,
        month_year: monthYear,
        students: {
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          start_date: student.start_date
        },
        courses: {
          name: (student.courses as any)?.name || 'Curso no encontrado',
          price: (student.courses as any)?.price || 0,
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

      // Calculate earnings
      const completedClasses = classesArray.filter(c => c.status === 'completed')
      const totalEarned = completedClasses.reduce((sum, c) => sum + (c.price || 0), 0)
      const totalPaid = completedClasses.filter(c => c.payment_status === 'paid').reduce((sum, c) => sum + (c.price || 0), 0)
      const totalUnpaid = totalEarned - totalPaid

      const recurringCompleted = completedClasses.filter(c => c.is_recurring)
      const recurringEarned = recurringCompleted.reduce((sum, c) => sum + (c.price || 0), 0)
      const recurringPaid = recurringCompleted.filter(c => c.payment_status === 'paid').reduce((sum, c) => sum + (c.price || 0), 0)
      const recurringUnpaid = recurringEarned - recurringPaid

      const eventualCompleted = completedClasses.filter(c => !c.is_recurring)
      const eventualEarned = eventualCompleted.reduce((sum, c) => sum + (c.price || 0), 0)
      const eventualPaid = eventualCompleted.filter(c => c.payment_status === 'paid').reduce((sum, c) => sum + (c.price || 0), 0)
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
    return NextResponse.json(trackingData)
  } catch (error) {
    console.error('Error fetching class tracking:', error)
    return NextResponse.json({ error: 'Error al obtener el seguimiento de clases' }, { status: 500 })
  }
}
