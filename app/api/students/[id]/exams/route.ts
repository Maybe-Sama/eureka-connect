import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = Number(params.id)
    
    if (isNaN(studentId)) {
      return NextResponse.json({ error: 'ID de estudiante inválido' }, { status: 400 })
    }

    // Obtener exámenes del estudiante ordenados por fecha
    const { data: exams, error: examsError } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('student_id', studentId)
      .order('exam_date', { ascending: true })

    if (examsError) {
      console.error('Error fetching student exams:', examsError)
      return NextResponse.json({ error: 'Error al obtener exámenes del estudiante' }, { status: 500 })
    }

    return NextResponse.json({ exams: exams || [] })
  } catch (error) {
    console.error('Error in GET /api/students/[id]/exams:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
