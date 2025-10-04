/**
 * API para finalizar facturas (cambiar de provisional a final)
 * Las facturas finales no se pueden borrar según RRSIF
 */

import { NextRequest, NextResponse } from 'next/server'
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

    // En un entorno real, aquí se obtendría la factura de la base de datos
    // y se verificaría que esté en estado provisional
    const factura = {
      id: facturaId,
      numero: 'FAC-0001',
      estado_factura: 'provisional'
    }

    if (!factura) {
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

    // Cambiar estado a final
    const fechaFinalizacion = generarTimestamp()
    
    // En un entorno real, aquí se actualizaría la factura en la base de datos
    console.log(`Factura ${factura.numero} finalizada:`, {
      id: facturaId,
      fecha_finalizacion: fechaFinalizacion,
      estado_anterior: 'provisional',
      estado_nuevo: 'final'
    })

    // Registrar evento de finalización
    await registrarGeneracionFactura(
      factura.numero,
      'Factura finalizada (provisional → final)',
      'usuario'
    )

    return NextResponse.json({
      success: true,
      factura: {
        id: facturaId,
        numero: factura.numero,
        estado_factura: 'final',
        fecha_finalizacion: fechaFinalizacion
      }
    })

  } catch (error) {
    console.error('Error finalizando factura:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
