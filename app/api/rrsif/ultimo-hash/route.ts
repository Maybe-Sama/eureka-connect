/**
 * API para obtener el hash del último registro (encadenamiento RRSIF)
 */

import { NextRequest, NextResponse } from 'next/server'

// Simulación de base de datos para hash anterior
// En producción, esto debería consultar la base de datos real
let ultimoHash: string | null = null

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      hash: ultimoHash,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error obteniendo último hash:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error obteniendo último hash' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { hash } = await request.json()
    
    if (!hash) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Hash es requerido' 
        },
        { status: 400 }
      )
    }
    
    ultimoHash = hash
    
    return NextResponse.json({
      success: true,
      hash: ultimoHash,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error actualizando último hash:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error actualizando último hash' 
      },
      { status: 500 }
    )
  }
}
