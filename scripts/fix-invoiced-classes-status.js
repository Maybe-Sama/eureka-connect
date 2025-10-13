#!/usr/bin/env node

/**
 * Script para corregir el estado de las clases marcadas como facturadas
 * que no tienen facturas activas asociadas
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixInvoicedClassesStatus() {
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
      console.error('❌ Error obteniendo clases facturadas:', clasesError)
      return
    }

    if (!clasesFacturadas || clasesFacturadas.length === 0) {
      console.log('✅ No hay clases marcadas como facturadas')
      return
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
      console.error('❌ Error obteniendo facturas activas:', facturasError)
      return
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
      console.log('✅ Todas las clases marcadas como facturadas tienen facturas activas')
      return
    }

    // 4. Mostrar detalles de las clases huérfanas
    console.log(`\n🔍 Clases huérfanas encontradas:`)
    clasesHuerfanas.forEach((clase, index) => {
      console.log(`   ${index + 1}. ID: ${clase.id} | ${clase.students?.first_name} ${clase.students?.last_name} | ${clase.subject} | ${clase.date}`)
    })

    // 5. Corregir las clases huérfanas
    console.log(`\n🔧 Corrigiendo ${clasesHuerfanas.length} clases huérfanas...`)
    
    const idsParaCorregir = clasesHuerfanas.map(clase => clase.id)
    
    const { error: updateError } = await supabase
      .from('classes')
      .update({ status_invoice: false })
      .in('id', idsParaCorregir)

    if (updateError) {
      console.error('❌ Error corrigiendo clases:', updateError)
      return
    }

    console.log(`✅ ${idsParaCorregir.length} clases corregidas exitosamente`)

    // 6. Verificar el resultado
    console.log(`\n🔍 Verificación final:`)
    const { data: clasesCorregidas, error: verifyError } = await supabase
      .from('classes')
      .select('id, status_invoice')
      .in('id', idsParaCorregir)

    if (verifyError) {
      console.error('❌ Error verificando corrección:', verifyError)
      return
    }

    const clasesAunFacturadas = clasesCorregidas?.filter(c => c.status_invoice === true) || []
    if (clasesAunFacturadas.length === 0) {
      console.log('✅ Todas las clases fueron corregidas correctamente')
    } else {
      console.log(`⚠️ ${clasesAunFacturadas.length} clases aún están marcadas como facturadas`)
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
fixInvoicedClassesStatus()
  .then(() => {
    console.log('\n🎉 Script completado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })
