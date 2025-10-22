import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { validateSession } from '@/lib/auth-complex'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verificar que el examen pertenece al estudiante
    const { data: existingExam, error: fetchError } = await supabaseAdmin
      .from('exams')
      .select('id, student_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingExam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    if (existingExam.student_id !== authResult.user.studentId) {
      return NextResponse.json({ error: 'No autorizado para editar este examen' }, { status: 403 })
    }

    // Actualizar el examen
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .update({
        subject,
        exam_date,
        exam_time: exam_time && exam_time.trim() !== '' ? exam_time : null,
        notes: notes && notes.trim() !== '' ? notes : null,
        grade: grade ? parseFloat(grade) : null
      })
      .eq('id', params.id)
      .select()
      .single()

    if (examError) {
      console.error('Error updating exam:', examError)
      return NextResponse.json({ error: 'Error al actualizar examen' }, { status: 500 })
    }

    return NextResponse.json({ exam })
  } catch (error) {
    console.error('Error in PUT /api/exams/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Verificar que el examen pertenece al estudiante
    const { data: existingExam, error: fetchError } = await supabaseAdmin
      .from('exams')
      .select('id, student_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingExam) {
      return NextResponse.json({ error: 'Examen no encontrado' }, { status: 404 })
    }

    if (existingExam.student_id !== authResult.user.studentId) {
      return NextResponse.json({ error: 'No autorizado para eliminar este examen' }, { status: 403 })
    }

    // Eliminar el examen
    const { error: deleteError } = await supabaseAdmin
      .from('exams')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('Error deleting exam:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar examen' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Examen eliminado correctamente' })
  } catch (error) {
    console.error('Error in DELETE /api/exams/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
