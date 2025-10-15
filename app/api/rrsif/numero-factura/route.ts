// @ts-nocheck
/**
 * API para generación de números de factura correlativos anuales
 * Cumple con RRSIF - numeración correlativa por año
 * Ahora usa Supabase para obtener el siguiente número correlativo
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'
import { formatearNumeroFactura, RRSIF_CONSTANTS } from '@/lib/rrsif-utils'

export async function POST(request: NextRequest) {
  try {
    const año = new Date().getFullYear()
    const serie = RRSIF_CONSTANTS.SERIE_DEFAULT
    
    // Obtener el último número de factura del año actual
    const { data: ultimaFactura, error } = await supabase
      .from('facturas_rrsif')
      .select('invoice_number')
      .like('invoice_number', `${serie}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Error obteniendo última factura:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo numeración de la base de datos' 
        },
        { status: 500 }
      )
    }
    
    // Calcular siguiente número correlativo
    let siguienteNumero = 1
    if (ultimaFactura && ultimaFactura.length > 0) {
      const ultimoNumero = ultimaFactura[0].invoice_number
      // Extraer el número correlativo del formato SERIE-NNNN
      const partes = ultimoNumero.split('-')
      if (partes.length === 2 && partes[1]) {
        siguienteNumero = parseInt(partes[1]) + 1
      }
    }
    
    // Generar número de factura
    const numero = formatearNumeroFactura(serie, siguienteNumero)
    
    return NextResponse.json({
      success: true,
      numero,
      serie,
      numeroCorrelativo: siguienteNumero,
      año
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
    const año = new Date().getFullYear()
    const serie = RRSIF_CONSTANTS.SERIE_DEFAULT
    
    // Obtener el último número de factura del año actual
    const { data: ultimaFactura, error } = await supabase
      .from('facturas_rrsif')
      .select('invoice_number')
      .like('invoice_number', `${serie}-%`)
      .order('invoice_number', { ascending: false })
      .limit(1)
    
    if (error) {
      console.error('Error obteniendo última factura:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error obteniendo numeración de la base de datos' 
        },
        { status: 500 }
      )
    }
    
    // Calcular siguiente número correlativo
    let siguienteNumero = 1
    if (ultimaFactura && ultimaFactura.length > 0) {
      const ultimoNumero = ultimaFactura[0].invoice_number
      // Extraer el número correlativo del formato SERIE-NNNN
      const partes = ultimoNumero.split('-')
      if (partes.length === 2 && partes[1]) {
        siguienteNumero = parseInt(partes[1]) + 1
      }
    }
    
    return NextResponse.json({
      success: true,
      numeracionActual: siguienteNumero - 1,
      añoActual: año,
      serie: RRSIF_CONSTANTS.SERIE_DEFAULT,
      siguienteNumero: formatearNumeroFactura(RRSIF_CONSTANTS.SERIE_DEFAULT, siguienteNumero)
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
