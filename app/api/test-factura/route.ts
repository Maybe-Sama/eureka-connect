import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('Test factura recibido:', body)
    
    return NextResponse.json({
      success: true,
      message: 'Test factura funcionando',
      data: body
    })
  } catch (error) {
    console.error('Error en test factura:', error)
    return NextResponse.json(
      { error: 'Error en test factura' },
      { status: 500 }
    )
  }
}

