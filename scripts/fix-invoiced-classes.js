#!/usr/bin/env node

/**
 * Script para identificar y corregir clases que deberían estar disponibles para facturar
 * pero están marcadas como facturadas sin tener una factura activa
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixInvoicedClasses() {
  try {
    console.log('🔍 Analizando clases marcadas como facturadas...')
    
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

    console.log(`📊 Encontradas ${clasesFacturadas?.length || 0} clases marcadas como facturadas`)

    if (!clasesFacturadas || clasesFacturadas.length === 0) {
      console.log('✅ No hay clases marcadas como facturadas')
      return
    }

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

    // 3. Identificar clases que NO tienen facturas activas
    const clasesConFacturas = new Set(facturasActivas?.map(f => f.clase_id) || [])
    const clasesSinFacturas = clasesFacturadas.filter(clase => 
      !clasesConFacturas.has(clase.id)
    )

    console.log(`\n📋 Análisis de clases facturadas:`)
    console.log(`   - Total marcadas como facturadas: ${clasesFacturadas.length}`)
    console.log(`   - Con facturas activas: ${clasesConFacturas.size}`)
    console.log(`   - Sin facturas activas (huérfanas): ${clasesSinFacturas.length}`)

    if (clasesSinFacturas.length === 0) {
      console.log('✅ Todas las clases marcadas como facturadas tienen facturas activas')
      return
    }

    // 4. Mostrar detalles de las clases huérfanas
    console.log(`\n🚨 Clases que deberían estar disponibles:`)
    clasesSinFacturas.forEach((clase, index) => {
      console.log(`\n${index + 1}. Clase ID ${clase.id}`)
      console.log(`   👤 Estudiante: ${clase.students?.first_name} ${clase.students?.last_name}`)
      console.log(`   📅 Fecha: ${clase.date} ${clase.start_time}-${clase.end_time}`)
      console.log(`   📚 Asignatura: ${clase.subject || 'Clase particular'}`)
      console.log(`   💰 Precio: €${clase.price}`)
      console.log(`   💳 Estado pago: ${clase.payment_status}`)
    })

    // 5. Preguntar si se quiere corregir
    console.log(`\n🔧 ¿Quieres corregir estas ${clasesSinFacturas.length} clases?`)
    console.log('   Esto las marcará como disponibles para facturar nuevamente.')
    
    // En un entorno real, aquí podrías usar readline para preguntar al usuario
    // Por ahora, vamos a corregir automáticamente
    const corregir = true // Cambiar a false si no quieres corrección automática

    if (corregir) {
      console.log('\n🔧 Corrigiendo clases huérfanas...')
      
      const idsParaCorregir = clasesSinFacturas.map(clase => clase.id)
      
      const { error: updateError } = await supabase
        .from('classes')
        .update({ status_invoice: false })
        .in('id', idsParaCorregir)

      if (updateError) {
        console.error('❌ Error corrigiendo clases:', updateError)
        return
      }

      console.log(`✅ ${idsParaCorregir.length} clases corregidas exitosamente`)
      console.log('   Ahora están disponibles para facturar nuevamente')

      // 6. Verificar el resultado
      console.log('\n🔍 Verificando corrección...')
      const { data: clasesCorregidas, error: verifyError } = await supabase
        .from('classes')
        .select('id, status_invoice')
        .in('id', idsParaCorregir)

      if (verifyError) {
        console.error('❌ Error verificando corrección:', verifyError)
      } else {
        const corregidasCorrectamente = clasesCorregidas?.filter(c => c.status_invoice === false).length || 0
        console.log(`✅ ${corregidasCorrectamente}/${idsParaCorregir.length} clases verificadas como corregidas`)
      }
    } else {
      console.log('⏭️  Corrección cancelada por el usuario')
    }

    // 7. Mostrar resumen final
    console.log('\n📊 Resumen final:')
    const { data: resumenFinal, error: resumenError } = await supabase
      .from('classes')
      .select('status_invoice', { count: 'exact' })

    if (!resumenError && resumenFinal) {
      const total = resumenFinal.length
      const facturadas = resumenFinal.filter(c => c.status_invoice === true).length
      const noFacturadas = resumenFinal.filter(c => c.status_invoice === false).length
      
      console.log(`   - Total de clases: ${total}`)
      console.log(`   - Marcadas como facturadas: ${facturadas}`)
      console.log(`   - Disponibles para facturar: ${noFacturadas}`)
    }

    console.log('\n🎉 Proceso completado!')

  } catch (error) {
    console.error('❌ Error durante el proceso:', error)
  }
}

// Ejecutar el script
fixInvoicedClasses()
