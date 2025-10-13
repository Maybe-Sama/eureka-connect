#!/usr/bin/env node

/**
 * Script de prueba para verificar el funcionamiento del campo status_invoice
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

async function testStatusInvoice() {
  try {
    console.log('🧪 Probando el sistema de status_invoice...')
    
    // 1. Verificar que el campo existe
    console.log('\n1. Verificando campo status_invoice...')
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'classes')
      .eq('column_name', 'status_invoice')

    if (columnsError) {
      console.error('❌ Error verificando campo:', columnsError)
      return
    }

    if (columns && columns.length > 0) {
      console.log('✅ Campo status_invoice existe:', columns[0])
    } else {
      console.log('❌ Campo status_invoice no encontrado')
      return
    }

    // 2. Verificar estado actual de las clases
    console.log('\n2. Verificando estado de las clases...')
    const { data: allClasses, error: classesError } = await supabase
      .from('classes')
      .select('id, status_invoice, payment_status, price')
      .order('id', { ascending: false })
      .limit(10)

    if (classesError) {
      console.error('❌ Error obteniendo clases:', classesError)
      return
    }

    console.log('📊 Estado de las clases (últimas 10):')
    allClasses?.forEach(clase => {
      console.log(`  ID: ${clase.id}, status_invoice: ${clase.status_invoice}, payment_status: ${clase.payment_status}, price: €${clase.price}`)
    })

    // 3. Contar clases por estado
    console.log('\n3. Contando clases por estado...')
    const total = allClasses?.length || 0
    const invoiced = allClasses?.filter(c => c.status_invoice === true).length || 0
    const notInvoiced = allClasses?.filter(c => c.status_invoice === false).length || 0
    const nullStatus = allClasses?.filter(c => c.status_invoice === null).length || 0

    console.log(`📈 Resumen:`)
    console.log(`  - Total consultadas: ${total}`)
    console.log(`  - Facturadas (true): ${invoiced}`)
    console.log(`  - No facturadas (false): ${notInvoiced}`)
    console.log(`  - Sin estado (null): ${nullStatus}`)

    // 4. Probar consulta de clases para facturar
    console.log('\n4. Probando consulta de clases para facturar...')
    const { data: classesForInvoice, error: invoiceError } = await supabase
      .from('classes')
      .select('id, status_invoice, payment_status, price')
      .eq('status_invoice', false)
      .in('payment_status', ['paid'])

    if (invoiceError) {
      console.error('❌ Error en consulta de clases para facturar:', invoiceError)
    } else {
      console.log(`✅ Clases disponibles para facturar: ${classesForInvoice?.length || 0}`)
      if (classesForInvoice && classesForInvoice.length > 0) {
        console.log('📋 Primeras 5 clases disponibles:')
        classesForInvoice.slice(0, 5).forEach(clase => {
          console.log(`  ID: ${clase.id}, price: €${clase.price}`)
        })
      }
    }

    // 5. Probar marcado de clase como facturada
    if (classesForInvoice && classesForInvoice.length > 0) {
      console.log('\n5. Probando marcado de clase como facturada...')
      const testClassId = classesForInvoice[0].id
      
      // Marcar como facturada
      const { error: markError } = await supabase
        .from('classes')
        .update({ status_invoice: true })
        .eq('id', testClassId)

      if (markError) {
        console.error('❌ Error marcando clase como facturada:', markError)
      } else {
        console.log(`✅ Clase ${testClassId} marcada como facturada`)

        // Verificar que ya no aparece en la consulta
        const { data: updatedClasses, error: verifyError } = await supabase
          .from('classes')
          .select('id, status_invoice')
          .eq('id', testClassId)
          .single()

        if (verifyError) {
          console.error('❌ Error verificando clase:', verifyError)
        } else {
          console.log(`✅ Verificación: status_invoice = ${updatedClasses.status_invoice}`)
        }

        // Desmarcar para no afectar el sistema
        const { error: unmarkError } = await supabase
          .from('classes')
          .update({ status_invoice: false })
          .eq('id', testClassId)

        if (unmarkError) {
          console.error('❌ Error desmarcando clase:', unmarkError)
        } else {
          console.log(`✅ Clase ${testClassId} desmarcada (restaurada)`)
        }
      }
    }

    console.log('\n🎉 Prueba completada exitosamente!')
    console.log('\n📝 Próximos pasos:')
    console.log('   1. Verifica que el frontend muestre solo clases no facturadas')
    console.log('   2. Prueba crear una factura')
    console.log('   3. Verifica que las clases se marquen como facturadas')
    console.log('   4. Prueba eliminar una factura provisional')
    console.log('   5. Verifica que las clases se desmarcan')

  } catch (error) {
    console.error('❌ Error durante la prueba:', error)
  }
}

// Ejecutar la prueba
testStatusInvoice()
