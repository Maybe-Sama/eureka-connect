import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('punishment_types')
      .select('*')
      .eq('is_active', true)
      .order('severity', { ascending: true })

    if (error) {
      console.error('Error fetching punishment types:', error)
      return NextResponse.json({ error: 'Error fetching punishment types' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in punishment types API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, color, severity } = body

    if (!name || !color || !severity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('punishment_types')
      .insert({
        name,
        description: description || '',
        color,
        severity: parseInt(severity),
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating punishment type:', error)
      return NextResponse.json({ error: 'Error creating punishment type' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in punishment types POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, color, severity, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing punishment type ID' }, { status: 400 })
    }

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (color !== undefined) updateData.color = color
    if (severity !== undefined) updateData.severity = parseInt(severity)
    if (is_active !== undefined) updateData.is_active = is_active

    const { data, error } = await supabase
      .from('punishment_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating punishment type:', error)
      return NextResponse.json({ error: 'Error updating punishment type' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in punishment types PUT API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
