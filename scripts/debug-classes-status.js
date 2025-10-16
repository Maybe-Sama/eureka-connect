#!/usr/bin/env node

/**
 * Script de depuración para verificar el estado de las clases
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

async function debugClassesStatus() {
  try {
    console.log('🔍 Depurando estado de las clases...')
    
    // 1. Obtener TODAS las clases con su estado
    const { data: allClasses, error: allClassesError } = await supabase
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
        status,
        students!classes_student_id_fkey (
          first_name,
          last_name
        )
      `)
      .order('id', { ascending: false })
      .limit(20)

    if (allClassesError) {
      console.error('❌ Error obteniendo todas las clases:', allClassesError)
      return
    }

    console.log(`\n📊 Estado de las últimas 20 clases:`)
    console.log('ID | Estudiante | Fecha | Precio | Payment | Status | Invoice | Subject')
    console.log('---|------------|-------|--------|---------|--------|---------|--------')
    
    allClasses?.forEach(clase => {
      const estudiante = clase.students ? `${clase.students.first_name} ${clase.students.last_name}` : 'N/A'
      const fecha = clase.date || 'N/A'
      const precio = `€${clase.price || 0}`
      const payment = clase.payment_status || 'N/A'
      const status = clase.status || 'N/A'
      const invoice = clase.status_invoice ? 'TRUE' : 'FALSE'
      const subject = clase.subject || 'N/A'
      
      console.log(`${clase.id.toString().padEnd(2)} | ${estudiante.padEnd(10)} | ${fecha} | ${precio.padEnd(6)} | ${payment.padEnd(7)} | ${status.padEnd(6)} | ${invoice.padEnd(7)} | ${subject}`)
    })

    // 2. Contar por estado
    const total = allClasses?.length || 0
    const paid = allClasses?.filter(c => c.payment_status === 'paid').length || 0
    const completed = allClasses?.filter(c => c.status === 'completed').length || 0
    const invoiced = allClasses?.filter(c => c.status_invoice === true).length || 0
    const notInvoiced = allClasses?.filter(c => c.status_invoice === false).length || 0
    const nullInvoice = allClasses?.filter(c => c.status_invoice === null).length || 0

    console.log(`\n📈 Resumen de estados:`)
    console.log(`   - Total consultadas: ${total}`)
    console.log(`   - Payment status = 'paid': ${paid}`)
    console.log(`   - Status = 'completed': ${completed}`)
    console.log(`   - Status_invoice = true: ${invoiced}`)
    console.log(`   - Status_invoice = false: ${notInvoiced}`)
    console.log(`   - Status_invoice = null: ${nullInvoice}`)

    // 3. Verificar clases que DEBERÍAN aparecer para facturar
    const clasesParaFacturar = allClasses?.filter(clase => {
      const isPaid = clase.payment_status === 'paid'
      const notInvoiced = !clase.status_invoice
      return isPaid && notInvoiced
    }) || []

    console.log(`\n✅ Clases que DEBERÍAN aparecer para facturar: ${clasesParaFacturar.length}`)
    
    if (clasesParaFacturar.length > 0) {
      console.log('\n📋 Detalles de clases disponibles:')
      clasesParaFacturar.forEach((clase, index) => {
        const estudiante = clase.students ? `${clase.students.first_name} ${clase.students.last_name}` : 'N/A'
        console.log(`   ${index + 1}. ID ${clase.id} - ${estudiante} - ${clase.date} - €${clase.price}`)
      })
    } else {
      console.log('   ⚠️  No hay clases disponibles para facturar')
    }

    // 4. Verificar clases marcadas como facturadas
    const clasesFacturadas = allClasses?.filter(c => c.status_invoice === true) || []
    console.log(`\n🔒 Clases marcadas como facturadas: ${clasesFacturadas.length}`)
    
    if (clasesFacturadas.length > 0) {
      console.log('\n📋 Detalles de clases facturadas:')
      clasesFacturadas.forEach((clase, index) => {
        const estudiante = clase.students ? `${clase.students.first_name} ${clase.students.last_name}` : 'N/A'
        console.log(`   ${index + 1}. ID ${clase.id} - ${estudiante} - ${clase.date} - €${clase.price}`)
      })
    }

    // 5. Verificar si hay facturas activas para las clases facturadas
    if (clasesFacturadas.length > 0) {
      const classIds = clasesFacturadas.map(c => c.id)
      
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
      } else {
        const clasesConFacturas = new Set(facturasActivas?.map(f => f.clase_id) || [])
        const clasesHuerfanas = clasesFacturadas.filter(c => !clasesConFacturas.has(c.id))
        
        console.log(`\n🔍 Análisis de facturas:`)
        console.log(`   - Clases con facturas activas: ${clasesConFacturas.size}`)
        console.log(`   - Clases huérfanas (sin factura activa): ${clasesHuerfanas.length}`)
        
        if (clasesHuerfanas.length > 0) {
          console.log('\n🚨 Clases huérfanas que deberían estar disponibles:')
          clasesHuerfanas.forEach((clase, index) => {
            const estudiante = clase.students ? `${clase.students.first_name} ${clase.students.last_name}` : 'N/A'
            console.log(`   ${index + 1}. ID ${clase.id} - ${estudiante} - ${clase.date} - €${clase.price}`)
          })
        }
      }
    }

    console.log('\n🎯 Recomendaciones:')
    if (clasesParaFacturar.length === 0) {
      console.log('   - No hay clases disponibles para facturar')
      console.log('   - Verifica que las clases tengan payment_status = "paid" o status = "completed"')
      console.log('   - Verifica que las clases tengan status_invoice = false o null')
    } else {
      console.log(`   - Hay ${clasesParaFacturar.length} clases disponibles para facturar`)
      console.log('   - Si no aparecen en el frontend, revisa el filtrado en el código')
    }

  } catch (error) {
    console.error('❌ Error durante la depuración:', error)
  }
}

// Ejecutar la depuración
debugClassesStatus()
