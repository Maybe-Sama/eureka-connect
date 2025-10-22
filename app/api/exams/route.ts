// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { validateSession } from '@/lib/auth-complex'

export async function GET(request: NextRequest) {
  try {
    // Obtener token de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Validar sesión
    const authResult = await validateSession(token)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // Verificar que es un estudiante
    if (authResult.user.userType !== 'student' || !authResult.user.studentId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    // Obtener exámenes del estudiante ordenados por fecha
    const { data: exams, error: examsError } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('student_id', authResult.user.studentId)
      .order('exam_date', { ascending: true })

    if (examsError) {
      console.error('Error fetching exams:', examsError)
      return NextResponse.json({ error: 'Error al obtener exámenes' }, { status: 500 })
    }

    return NextResponse.json({ exams: exams || [] })
  } catch (error) {
    console.error('Error in GET /api/exams:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Obtener token de autorización
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Validar sesión
    const authResult = await validateSession(token)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Sesión inválida' }, { status: 401 })
    }

    // Verificar que es un estudiante
    if (authResult.user.userType !== 'student' || !authResult.user.studentId) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const body = await request.json()
    const { subject, exam_date, exam_time, notes, grade } = body

    // Validar datos requeridos
    if (!subject || !exam_date) {
      return NextResponse.json({ error: 'Asignatura y fecha son requeridos' }, { status: 400 })
    }

    // Crear el examen
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .insert({
        student_id: authResult.user.studentId,
        subject,
        exam_date,
        exam_time: exam_time && exam_time.trim() !== '' ? exam_time : null,
        notes: notes && notes.trim() !== '' ? notes : null,
        grade: grade ? parseFloat(grade) : null
      })
      .select()
      .single()

    if (examError) {
      console.error('Error creating exam:', examError)
      return NextResponse.json({ error: 'Error al crear examen' }, { status: 500 })
    }

    return NextResponse.json({ exam }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/exams:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
