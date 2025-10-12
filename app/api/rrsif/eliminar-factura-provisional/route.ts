/**
 * API para eliminar facturas provisionales
 * Solo se pueden eliminar facturas en estado provisional
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { registrarIncidencia } from '@/lib/event-logger'

export async function DELETE(request: NextRequest) {
  try {
    // Validar que la URL sea válida
    if (!request.url) {
      return NextResponse.json(
        { error: 'URL de request inválida' },
        { status: 400 }
      )
    }

    let searchParams
    try {
      const url = new URL(request.url)
      searchParams = url.searchParams
    } catch (urlError) {
      console.error('Error creando URL:', urlError)
      return NextResponse.json(
        { error: 'URL de request malformada' },
        { status: 400 }
      )
    }
    const facturaId = searchParams.get('id')

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
        { success: false, error: 'Solo se pueden eliminar facturas provisionales' },
        { status: 400 }
      )
    }

    // Eliminar factura provisional de la base de datos
    const { error: deleteError } = await supabase
      .from('facturas_rrsif')
      .delete()
      .eq('id', facturaId)

    if (deleteError) {
      console.error('Error eliminando factura:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Error al eliminar la factura' },
        { status: 500 }
      )
    }

    // También eliminar las clases asociadas
    const { error: clasesError } = await supabase
      .from('factura_clases')
      .delete()
      .eq('factura_id', facturaId)

    if (clasesError) {
      console.error('Error eliminando clases de factura:', clasesError)
      // No fallar si no se pueden eliminar las clases
    }

    console.log(`Factura provisional ${factura.invoice_number} eliminada:`, {
      id: facturaId,
      estado: factura.estado_factura,
      motivo: 'Eliminación solicitada por usuario'
    })

    // Registrar evento de eliminación
    await registrarIncidencia(
      `Factura provisional ${factura.invoice_number} eliminada`,
      'media'
    )

    return NextResponse.json({
      success: true,
      message: 'Factura provisional eliminada exitosamente',
      factura: {
        id: facturaId,
        numero: factura.invoice_number,
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
