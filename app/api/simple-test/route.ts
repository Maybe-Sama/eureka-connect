import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    // Test simple: buscar estudiante por código
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('id, student_code, first_name, last_name')
      .eq('student_code', '33392254129163196576')
      .maybeSingle()

    return NextResponse.json({
      success: true,
      student,
      error,
      message: 'Test simple de búsqueda de estudiante'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}