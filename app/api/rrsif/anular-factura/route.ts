/**
 * API para anulación de facturas RRSIF
 * Genera registro de anulación según normativa española
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  generarHashRegistro, 
  obtenerHashAnterior, 
  generarFirmaElectronica,
  generarIdUnico,
  generarTimestamp,
  generarTimestampNumerico,
  RRSIF_CONSTANTS
} from '@/lib/rrsif-utils'
import { 
  registrarAnulacionFactura,
  registrarIncidencia 
} from '@/lib/event-logger'
import { RegistroAnulacion } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { facturaId, motivo } = body

    // Validar datos de entrada
    if (!facturaId || !motivo) {
      return NextResponse.json(
        { success: false, error: 'FacturaId y motivo son requeridos' },
        { status: 400 }
      )
    }

    // En un entorno real, aquí se obtendría la factura de la base de datos
    // Por ahora, simulamos la obtención
    const facturaOriginal = {
      id: facturaId,
      numero: 'ERK-0001',
      hash_registro: 'hash_original_simulado'
    }

    if (!facturaOriginal) {
      return NextResponse.json(
        { success: false, error: 'Factura no encontrada' },
        { status: 404 }
      )
    }

    // Obtener hash anterior para encadenamiento
    const hashAnterior = await obtenerHashAnterior()

    // Crear registro de anulación
    const registroAnulacion: RegistroAnulacion = {
      id: generarIdUnico(),
      registro_original_id: facturaOriginal.id,
      motivo_anulacion: motivo,
      fecha_anulacion: generarTimestamp(),
      hash_registro: '', // Se calculará después
      hash_registro_anterior: hashAnterior || '',
      timestamp: generarTimestampNumerico(),
      firma: '', // Se generará después
      estado_envio: 'local',
      metadatos: {
        hora_exacta: generarTimestamp(),
        ip_emisor: request.headers.get('x-forwarded-for') || 'localhost',
        user_agent: request.headers.get('user-agent') || 'EURELA-CONNECT-RRSIF',
        dispositivo: 'servidor'
      },
      created_at: generarTimestamp(),
      updated_at: generarTimestamp()
    }

    // Calcular hash del registro de anulación
    registroAnulacion.hash_registro = generarHashRegistro(registroAnulacion)

    // Generar firma electrónica
    registroAnulacion.firma = generarFirmaElectronica(registroAnulacion)

    // Actualizar hash anterior en la base de datos
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rrsif/ultimo-hash`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hash: registroAnulacion.hash_registro })
      })
    } catch (error) {
      console.error('Error actualizando hash anterior:', error)
      await registrarIncidencia('Error actualizando hash anterior en anulación', 'media')
    }

    // Registrar evento de anulación
    await registrarAnulacionFactura(
      facturaOriginal.numero,
      motivo,
      registroAnulacion.hash_registro,
      'usuario'
    )

    // En un entorno real, aquí se guardaría el registro de anulación en la base de datos
    // y se marcaría la factura original como anulada
    console.log('Factura anulada RRSIF:', {
      facturaId,
      motivo,
      hash: registroAnulacion.hash_registro,
      timestamp: registroAnulacion.timestamp
    })

    return NextResponse.json({
      success: true,
      anulacion: {
        id: registroAnulacion.id,
        factura_original: facturaOriginal.numero,
        motivo,
        hash: registroAnulacion.hash_registro,
        fecha: registroAnulacion.fecha_anulacion
      }
    })

  } catch (error) {
    console.error('Error anulando factura RRSIF:', error)
    await registrarIncidencia('Error crítico anulando factura', 'critica')
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
