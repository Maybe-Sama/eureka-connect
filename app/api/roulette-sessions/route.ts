import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { getServiceRoleSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')
  const status = searchParams.get('status')

  try {
    let query = supabase
      .from('roulette_sessions')
      .select(`
        *,
        students(first_name, last_name, student_code),
        punishment_type:punishment_types(*)
      `)
      .order('created_at', { ascending: false })

    if (studentId) {
      query = query.eq('student_id', parseInt(studentId))
    }

    if (status) {
      query = query.eq('session_status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching roulette sessions:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error fetching roulette sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { student_id, teacher_id, session_status, selected_punishment_id } = await request.json()
  const serviceRoleSupabase = getServiceRoleSupabase()

  if (!student_id || !teacher_id) {
    return NextResponse.json({ error: 'Student ID and Teacher ID are required' }, { status: 400 })
  }

  try {
    const { data, error } = await serviceRoleSupabase
      .from('roulette_sessions')
      .insert({
        student_id,
        teacher_id,
        session_status: session_status || 'waiting',
        selected_punishment_id,
        spin_started_at: session_status === 'spinning' ? new Date().toISOString() : null
      })
      .select(`
        *,
        students(first_name, last_name, student_code),
        punishment_type:punishment_types(*)
      `)
      .single()

    if (error) {
      console.error('Error creating roulette session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating roulette session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { id, session_status, selected_punishment_id, result_id } = await request.json()
  const serviceRoleSupabase = getServiceRoleSupabase()

  if (!id) {
    return NextResponse.json({ error: 'Session ID is required' }, { status: 400 })
  }

  try {
    const updateData: any = {}
    if (session_status !== undefined) {
      updateData.session_status = session_status
      if (session_status === 'spinning') {
        updateData.spin_started_at = new Date().toISOString()
      } else if (session_status === 'completed') {
        updateData.spin_completed_at = new Date().toISOString()
      }
    }
    if (selected_punishment_id !== undefined) updateData.selected_punishment_id = selected_punishment_id
    if (result_id !== undefined) updateData.result_id = result_id

    const { data, error } = await serviceRoleSupabase
      .from('roulette_sessions')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        students(first_name, last_name, student_code),
        punishment_type:punishment_types(*)
      `)
      .single()

    if (error) {
      console.error('Error updating roulette session:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error updating roulette session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


