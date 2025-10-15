// @ts-nocheck
/**
 * API para finalizar facturas (cambiar de provisional a final)
 * Las facturas finales no se pueden borrar según RRSIF
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { generarTimestamp } from '@/lib/rrsif-utils'
import { registrarGeneracionFactura } from '@/lib/event-logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facturaId } = body

    // Validar datos de entrada
    if (!facturaId) {
      return NextResponse.json(
        { success: false, error: 'FacturaId es requerido' },
        { status: 400 }
      )
    }

    // Obtener la factura de la base de datos
    const { data: factura, error: facturaError } = await supabase
      .from('facturas_rrsif')
      .select('*')
      .eq('id', facturaId)
      .single()

    if (facturaError || !factura) {
      console.error('Error obteniendo factura:', facturaError)
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    if (factura.estado_factura !== 'provisional') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden finalizar facturas provisionales' },
        { status: 400 }
      )
    }

    // Cambiar estado a final en la base de datos
    const fechaFinalizacion = generarTimestamp()
    
    const { error: updateError } = await supabase
      .from('facturas_rrsif')
      .update({
        estado_factura: 'final',
        updated_at: new Date().toISOString()
      })
      .eq('id', facturaId)

    if (updateError) {
      console.error('Error actualizando factura:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error al finalizar la factura' },
        { status: 500 }
      )
    }

    console.log(`Factura ${factura.invoice_number} finalizada:`, {
      id: facturaId,
      fecha_finalizacion: fechaFinalizacion,
      estado_anterior: 'provisional',
      estado_nuevo: 'final'
    })

    // Registrar evento de finalización
    await registrarGeneracionFactura(
      factura.invoice_number,
      'Factura finalizada (provisional → final)',
      'usuario'
    )

    return NextResponse.json({
      success: true,
      factura: {
        id: facturaId,
        numero: factura.invoice_number,
        estado_factura: 'final',
        fecha_finalizacion: fechaFinalizacion
      },
      message: 'Factura finalizada exitosamente'
    })

  } catch (error) {
    console.error('Error finalizando factura:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
