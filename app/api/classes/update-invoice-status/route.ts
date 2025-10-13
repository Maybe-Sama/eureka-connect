import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { classId, statusInvoice } = body

    // Validar datos de entrada
    if (!classId || typeof statusInvoice !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'classId y statusInvoice son requeridos' },
        { status: 400 }
      )
    }

    // Actualizar el status_invoice de la clase
    const { error: updateError } = await supabase
      .from('classes')
      .update({ status_invoice: statusInvoice })
      .eq('id', classId)

    if (updateError) {
      console.error('Error actualizando status_invoice:', updateError)
      return NextResponse.json(
        { success: false, error: 'Error actualizando el estado de la clase' },
        { status: 500 }
      )
    }

    console.log(`✅ Clase ${classId} actualizada: status_invoice = ${statusInvoice}`)

    return NextResponse.json({
      success: true,
      message: `Clase ${classId} actualizada correctamente`,
      classId,
      statusInvoice
    })

  } catch (error) {
    console.error('Error actualizando status_invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
