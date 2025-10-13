import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Verificando clases marcadas como facturadas...')
    
    // 1. Obtener todas las clases marcadas como facturadas
    const { data: clasesFacturadas, error: clasesError } = await supabase
      .from('classes')
      .select(`
        id,
        date,
        start_time,
        end_time,
        subject,
        price,
        status_invoice,
        payment_status,
        students!classes_student_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('status_invoice', true)
      .order('id', { ascending: false })

    if (clasesError) {
      console.error('Error obteniendo clases facturadas:', clasesError)
      return NextResponse.json(
        { error: 'Error obteniendo clases facturadas' },
        { status: 500 }
      )
    }

    if (!clasesFacturadas || clasesFacturadas.length === 0) {
      return NextResponse.json({
        success: true,
        clasesCorregidas: 0,
        message: 'No hay clases marcadas como facturadas'
      })
    }

    console.log(`📊 Encontradas ${clasesFacturadas.length} clases marcadas como facturadas`)

    // 2. Verificar qué clases tienen facturas activas
    const classIds = clasesFacturadas.map(clase => clase.id)
    
    const { data: facturasActivas, error: facturasError } = await supabase
      .from('factura_clases')
      .select(`
        clase_id,
        factura_id,
        facturas_rrsif!inner (
          id,
          invoice_number,
          estado_factura
        )
      `)
      .in('clase_id', classIds)

    if (facturasError) {
      console.error('Error obteniendo facturas activas:', facturasError)
      return NextResponse.json(
        { error: 'Error obteniendo facturas activas' },
        { status: 500 }
      )
    }

    // 3. Identificar clases que NO tienen facturas activas (huérfanas)
    const clasesConFacturas = new Set(facturasActivas?.map(f => f.clase_id) || [])
    const clasesHuerfanas = clasesFacturadas.filter(clase => 
      !clasesConFacturas.has(clase.id)
    )

    console.log(`📋 Análisis:`)
    console.log(`   - Total marcadas como facturadas: ${clasesFacturadas.length}`)
    console.log(`   - Con facturas activas: ${clasesConFacturas.size}`)
    console.log(`   - Sin facturas activas (huérfanas): ${clasesHuerfanas.length}`)

    if (clasesHuerfanas.length === 0) {
      return NextResponse.json({
        success: true,
        clasesCorregidas: 0,
        message: 'Todas las clases marcadas como facturadas tienen facturas activas',
        detalles: {
          totalFacturadas: clasesFacturadas.length,
          conFacturasActivas: clasesConFacturas.size,
          huerfanas: 0
        }
      })
    }

    // 4. Corregir las clases huérfanas
    console.log(`🔧 Corrigiendo ${clasesHuerfanas.length} clases huérfanas...`)
    
    const idsParaCorregir = clasesHuerfanas.map(clase => clase.id)
    
    const { error: updateError } = await supabase
      .from('classes')
      .update({ status_invoice: false })
      .in('id', idsParaCorregir)

    if (updateError) {
      console.error('Error corrigiendo clases:', updateError)
      return NextResponse.json(
        { error: 'Error corrigiendo clases huérfanas' },
        { status: 500 }
      )
    }

    console.log(`✅ ${idsParaCorregir.length} clases corregidas exitosamente`)

    // 5. Obtener información detallada de las clases corregidas
    const clasesCorregidasInfo = clasesHuerfanas.map(clase => ({
      id: clase.id,
      estudiante: `${clase.students?.first_name} ${clase.students?.last_name}`,
      fecha: clase.date,
      horario: `${clase.start_time}-${clase.end_time}`,
      asignatura: clase.subject || 'Clase particular',
      precio: clase.price
    }))

    return NextResponse.json({
      success: true,
      clasesCorregidas: idsParaCorregir.length,
      message: `${idsParaCorregir.length} clases recuperadas y disponibles para facturar`,
      detalles: {
        totalFacturadas: clasesFacturadas.length,
        conFacturasActivas: clasesConFacturas.size,
        huerfanas: clasesHuerfanas.length,
        corregidas: idsParaCorregir.length
      },
      clasesCorregidas: clasesCorregidasInfo
    })

  } catch (error) {
    console.error('Error verificando clases:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
