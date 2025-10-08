import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'
import { getServiceRoleSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('student_id')

  if (!studentId) {
    return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('student_custom_punishments')
      .select(`
        *,
        punishment_type:punishment_types(*)
      `)
      .eq('student_id', parseInt(studentId))
      .order('order_position', { ascending: true })

    if (error) {
      console.error('Error fetching student custom punishments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error fetching student custom punishments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { student_id, punishment_type_id, is_selected, order_position } = await request.json()
  const serviceRoleSupabase = getServiceRoleSupabase()

  if (!student_id || !punishment_type_id) {
    return NextResponse.json({ error: 'Student ID and Punishment Type ID are required' }, { status: 400 })
  }

  try {
    const { data, error } = await serviceRoleSupabase
      .from('student_custom_punishments')
      .upsert({
        student_id,
        punishment_type_id,
        is_selected: is_selected || false,
        order_position: order_position || 0,
        is_unlocked: true // Por defecto desbloqueado
      })
      .select(`
        *,
        punishment_type:punishment_types(*)
      `)
      .single()

    if (error) {
      console.error('Error creating/updating student custom punishment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Unexpected error creating student custom punishment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const { id, is_selected, order_position, is_unlocked } = await request.json()
  const serviceRoleSupabase = getServiceRoleSupabase()

  if (!id) {
    return NextResponse.json({ error: 'Punishment ID is required' }, { status: 400 })
  }

  try {
    const updateData: any = {}
    if (is_selected !== undefined) updateData.is_selected = is_selected
    if (order_position !== undefined) updateData.order_position = order_position
    if (is_unlocked !== undefined) updateData.is_unlocked = is_unlocked

    const { data, error } = await serviceRoleSupabase
      .from('student_custom_punishments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        punishment_type:punishment_types(*)
      `)
      .single()

    if (error) {
      console.error('Error updating student custom punishment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Unexpected error updating student custom punishment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


