import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { generateClassesFromStartDate } from '@/lib/class-generation'

/**
 * SOURCE OF TRUTH: Class Comparison Endpoint
 * 
 * This endpoint compares expected classes (based on student schedules) 
 * with actual classes in the database and returns the differences.
 * 
 * Features:
 * - Shows missing classes that should exist
 * - Shows extra classes that shouldn't exist
 * - Allows selective generation of missing classes
 * - Provides detailed comparison data
 * 
 * Used by:
 * - Frontend "Compare Classes" button
 * - Class tracking dashboard
 * - Manual maintenance
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { studentId, month } = body

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

    const results = []
    const today = new Date().toISOString().split('T')[0]

    for (const student of studentsToProcess) {
      if (!student.start_date || !student.fixed_schedule) {
        results.push({
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          status: 'skipped',
          message: 'No tiene fecha de inicio o horario fijo configurado'
        })
        continue
      }

      // Calculate date range for comparison
      let startDate = student.start_date
      let endDate = today

      if (month) {
        // If month is specified, compare only that month
        const [year, monthNum] = month.split('-').map(Number)
        const monthStart = `${year}-${String(monthNum).padStart(2, '0')}-01`
        const monthEnd = new Date(year, monthNum, 0).toISOString().split('T')[0]
        
        startDate = monthStart > student.start_date ? monthStart : student.start_date
        endDate = monthEnd < today ? monthEnd : today
      }

      // Generate expected classes
      const expectedClasses = await generateClassesFromStartDate(
        student.id,
        student.course_id,
        student.fixed_schedule,
        startDate,
        endDate
      )

      // Get actual classes from database
      const { data: actualClasses, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('student_id', student.id)
        .eq('is_recurring', true)
        .gte('date', startDate)
        .lte('date', endDate)

      if (classesError) {
        console.error(`Error fetching classes for student ${student.id}:`, classesError)
        results.push({
          studentId: student.id,
          studentName: `${student.first_name} ${student.last_name}`,
          status: 'error',
          message: 'Error al obtener clases existentes'
        })
        continue
      }

      // Create comparison maps
      const expectedMap = new Map()
      const actualMap = new Map()

      // Map expected classes
      expectedClasses.forEach(cls => {
        const key = `${cls.date}-${cls.start_time}-${cls.end_time}`
        expectedMap.set(key, cls)
      })

      // Map actual classes
      actualClasses.forEach(cls => {
        const key = `${cls.date}-${cls.start_time}-${cls.end_time}`
        actualMap.set(key, cls)
      })

      // Find missing classes (expected but not actual)
      const missingClasses = []
      for (const [key, expectedClass] of expectedMap) {
        if (!actualMap.has(key)) {
          missingClasses.push(expectedClass)
        }
      }

      // Find extra classes (actual but not expected)
      const extraClasses = []
      for (const [key, actualClass] of actualMap) {
        if (!expectedMap.has(key)) {
          extraClasses.push(actualClass)
        }
      }

      results.push({
        studentId: student.id,
        studentName: `${student.first_name} ${student.last_name}`,
        status: 'success',
        dateRange: { startDate, endDate },
        expectedClasses: expectedClasses.length,
        actualClasses: actualClasses.length,
        missingClasses: missingClasses.length,
        extraClasses: extraClasses.length,
        missingClassesData: missingClasses,
        extraClassesData: extraClasses,
        summary: {
          totalExpected: expectedClasses.length,
          totalActual: actualClasses.length,
          missing: missingClasses.length,
          extra: extraClasses.length,
          match: expectedClasses.length - missingClasses.length
        }
      })
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalStudents: studentsToProcess.length,
        studentsWithIssues: results.filter(r => r.status === 'success' && (r.missingClasses > 0 || r.extraClasses > 0)).length,
        totalMissingClasses: results.reduce((sum, r) => sum + (r.missingClasses || 0), 0),
        totalExtraClasses: results.reduce((sum, r) => sum + (r.extraClasses || 0), 0)
      }
    })

  } catch (error) {
    console.error('Error comparing classes:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
