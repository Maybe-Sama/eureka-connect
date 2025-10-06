/**
 * API para gestión de configuración fiscal RRSIF
 * Guarda y recupera los datos fiscales del emisor
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('configuracion_fiscal')
      .select('*')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching fiscal config:', error)
      return NextResponse.json(
        { success: false, error: 'Error al obtener configuración fiscal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      configuracion: data || null
    })
  } catch (error) {
    console.error('Error in GET /api/rrsif/configuracion-fiscal:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { datosFiscales } = body

    if (!datosFiscales) {
      return NextResponse.json(
        { success: false, error: 'Datos fiscales requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe una configuración
    const { data: existingConfig } = await supabase
      .from('configuracion_fiscal')
      .select('id')
      .single()

    let result
    if (existingConfig) {
      // Actualizar configuración existente
      result = await supabase
        .from('configuracion_fiscal')
        .update({
          datos_fiscales: datosFiscales,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConfig.id)
    } else {
      // Crear nueva configuración
      result = await supabase
        .from('configuracion_fiscal')
        .insert({
          datos_fiscales: datosFiscales,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    if (result.error) {
      console.error('Error saving fiscal config:', result.error)
      return NextResponse.json(
        { success: false, error: 'Error al guardar configuración fiscal' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración fiscal guardada correctamente'
    })
  } catch (error) {
    console.error('Error in POST /api/rrsif/configuracion-fiscal:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
