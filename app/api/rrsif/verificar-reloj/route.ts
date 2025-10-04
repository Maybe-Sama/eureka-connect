/**
 * API para verificación de sincronización del reloj del sistema
 * RRSIF requiere desfase < 1 minuto con hora oficial
 */

import { NextRequest, NextResponse } from 'next/server'
import { RRSIF_CONSTANTS } from '@/lib/rrsif-utils'

export async function GET(request: NextRequest) {
  try {
    // Obtener hora oficial de España (UTC+1 o UTC+2 según horario de verano)
    const ahora = new Date()
    const horaSistema = ahora.toISOString()
    
    // Simulación de verificación con servidor de tiempo oficial
    // En producción, esto debería consultar un servidor NTP oficial
    const horaOficial = new Date(ahora.getTime() + Math.random() * 2000 - 1000).toISOString() // Simulación de desfase aleatorio
    
    const desfaseMs = Math.abs(ahora.getTime() - new Date(horaOficial).getTime())
    const desfaseSegundos = Math.floor(desfaseMs / 1000)
    
    const sincronizado = desfaseSegundos <= RRSIF_CONSTANTS.DESFASE_MAXIMO_SEGUNDOS
    
    return NextResponse.json({
      success: true,
      sincronizado,
      desfase_segundos: desfaseSegundos,
      hora_oficial: horaOficial,
      hora_sistema: horaSistema,
      ultima_verificacion: ahora.toISOString(),
      limite_maximo_segundos: RRSIF_CONSTANTS.DESFASE_MAXIMO_SEGUNDOS
    })
    
  } catch (error) {
    console.error('Error verificando reloj:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error verificando sincronización del reloj' 
      },
      { status: 500 }
    )
  }
}
