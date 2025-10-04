/**
 * API para obtener facturas RRSIF
 * Retorna lista de facturas con información de cumplimiento normativo
 */

import { NextRequest, NextResponse } from 'next/server'
import { FacturaRRSIF } from '@/types'

// Almacenamiento en memoria con estructura de base de datos
// En producción, esto debería estar en una base de datos real
const facturasStorage = new Map<string, FacturaRRSIF>()

export async function GET(request: NextRequest) {
  try {
    const facturas = Array.from(facturasStorage.values())
    return NextResponse.json(facturas)

  } catch (error) {
    console.error('Error obteniendo facturas RRSIF:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { factura } = body

    if (!factura) {
      return NextResponse.json(
        { success: false, error: 'Datos de factura requeridos' },
        { status: 400 }
      )
    }

    // Guardar factura en el almacenamiento
    facturasStorage.set(factura.id, factura)

    return NextResponse.json({
      success: true,
      factura: factura,
      message: 'Factura guardada exitosamente'
    })

  } catch (error) {
    console.error('Error guardando factura RRSIF:', error)
    
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
