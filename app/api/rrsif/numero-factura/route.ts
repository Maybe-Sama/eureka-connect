/**
 * API para generación de números de factura correlativos anuales
 * Cumple con RRSIF - numeración correlativa por año
 */

import { NextRequest, NextResponse } from 'next/server'
import { formatearNumeroFactura, RRSIF_CONSTANTS } from '@/lib/rrsif-utils'

// Simulación de base de datos para numeración
// En producción, esto debería estar en la base de datos real
let numeracionActual = 0
let añoActual = new Date().getFullYear()

export async function POST(request: NextRequest) {
  try {
    const año = new Date().getFullYear()
    
    // Si cambió el año, reiniciar numeración
    if (año !== añoActual) {
      numeracionActual = 0
      añoActual = año
    }
    
    // Incrementar numeración
    numeracionActual++
    
    // Generar número de factura
    const numero = formatearNumeroFactura(RRSIF_CONSTANTS.SERIE_DEFAULT, numeracionActual)
    
    return NextResponse.json({
      success: true,
      numero,
      serie: RRSIF_CONSTANTS.SERIE_DEFAULT,
      numeroCorrelativo: numeracionActual,
      año: añoActual
    })
    
  } catch (error) {
    console.error('Error generando número de factura:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error generando número de factura' 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      numeracionActual,
      añoActual,
      serie: RRSIF_CONSTANTS.SERIE_DEFAULT,
      siguienteNumero: formatearNumeroFactura(RRSIF_CONSTANTS.SERIE_DEFAULT, numeracionActual + 1)
    })
    
  } catch (error) {
    console.error('Error obteniendo numeración:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo numeración' 
      },
      { status: 500 }
    )
  }
}
