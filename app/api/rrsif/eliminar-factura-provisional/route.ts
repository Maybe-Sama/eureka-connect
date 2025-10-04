/**
 * API para eliminar facturas provisionales
 * Solo se pueden eliminar facturas en estado provisional
 */

import { NextRequest, NextResponse } from 'next/server'
import { registrarIncidencia } from '@/lib/event-logger'

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const facturaId = searchParams.get('id')

    // Validar datos de entrada
    if (!facturaId) {
      return NextResponse.json(
        { success: false, error: 'FacturaId es requerido' },
        { status: 400 }
      )
    }

    // En un entorno real, aquí se obtendría la factura de la base de datos
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
        { success: false, error: 'Solo se pueden eliminar facturas provisionales' },
        { status: 400 }
      )
    }

    // Eliminar factura provisional
    // En un entorno real, aquí se eliminaría la factura de la base de datos
    console.log(`Factura provisional ${factura.numero} eliminada:`, {
      id: facturaId,
      estado: factura.estado_factura,
      motivo: 'Eliminación solicitada por usuario'
    })

    // Registrar evento de eliminación
    await registrarIncidencia(
      `Factura provisional ${factura.numero} eliminada`,
      'media'
    )

    return NextResponse.json({
      success: true,
      message: 'Factura provisional eliminada exitosamente',
      factura: {
        id: facturaId,
        numero: factura.numero,
        estado: factura.estado_factura
      }
    })

  } catch (error) {
    console.error('Error eliminando factura provisional:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
