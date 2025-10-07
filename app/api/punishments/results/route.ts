import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '10')

    let query = supabase
      .from('punishment_results')
      .select(`
        *,
        punishment_type:punishment_types(*)
      `)
      .order('result_date', { ascending: false })
      .limit(limit)

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching punishment results:', error)
      return NextResponse.json({ error: 'Error fetching punishment results' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in punishment results API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { student_id, punishment_type_id, teacher_id, notes } = body

    if (!student_id || !punishment_type_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificar permisos de seguridad
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verificar que el usuario tenga permisos para crear castigos para este estudiante
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type, student_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Solo permitir si es profesor o si es el mismo estudiante
    if (userData.user_type !== 'teacher' && 
        userData.student_id?.toString() !== student_id.toString()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('punishment_results')
      .insert({
        student_id,
        punishment_type_id,
        teacher_id: teacher_id || null,
        notes: notes || null,
        result_date: new Date().toISOString(),
        is_completed: false
      })
      .select(`
        *,
        punishment_type:punishment_types(*)
      `)
      .single()

    if (error) {
      console.error('Error creating punishment result:', error)
      return NextResponse.json({ error: 'Error creating punishment result' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in punishment results POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, is_completed, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing punishment result ID' }, { status: 400 })
    }

    // Verificar permisos de seguridad
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Verificar que el usuario tenga permisos para modificar este castigo
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_type, student_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Obtener información del castigo para verificar permisos
    const { data: punishmentData, error: punishmentError } = await supabase
      .from('punishment_results')
      .select('student_id')
      .eq('id', id)
      .single()

    if (punishmentError || !punishmentData) {
      return NextResponse.json({ error: 'Punishment not found' }, { status: 404 })
    }

    // Solo permitir si es profesor o si es el mismo estudiante (pero solo para ver, no para marcar como completado)
    if (userData.user_type !== 'teacher' && 
        userData.student_id?.toString() !== punishmentData.student_id.toString()) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Solo el profesor puede marcar como completado
    if (is_completed !== undefined && userData.user_type !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can mark punishments as completed' }, { status: 403 })
    }

    const updateData: any = {}
    if (is_completed !== undefined) {
      updateData.is_completed = is_completed
      if (is_completed) {
        updateData.completed_at = new Date().toISOString()
      }
    }
    if (notes !== undefined) updateData.notes = notes

    const { data, error } = await supabase
      .from('punishment_results')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        punishment_type:punishment_types(*)
      `)
      .single()

    if (error) {
      console.error('Error updating punishment result:', error)
      return NextResponse.json({ error: 'Error updating punishment result' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in punishment results PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
