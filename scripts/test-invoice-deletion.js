#!/usr/bin/env node

/**
 * Script para probar la eliminación de facturas y verificar que se actualiza status_invoice
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

async function testInvoiceDeletion() {
  try {
    console.log('🔍 Verificando estado de facturas y clases...')
    
    // 1. Obtener facturas provisionales
    const { data: facturasProvisionales, error: facturasError } = await supabase
      .from('facturas_rrsif')
      .select(`
        id,
        invoice_number,
        estado_factura,
        factura_clases (
          clase_id,
          classes!inner (
            id,
            date,
            subject,
            status_invoice
          )
        )
      `)
      .eq('estado_factura', 'provisional')

    if (facturasError) {
      console.error('❌ Error obteniendo facturas:', facturasError)
      return
    }

    console.log(`📄 Facturas provisionales encontradas: ${facturasProvisionales?.length || 0}`)

    if (!facturasProvisionales || facturasProvisionales.length === 0) {
      console.log('ℹ️ No hay facturas provisionales para probar')
      return
    }

    // 2. Mostrar detalles de la primera factura
    const factura = facturasProvisionales[0]
    console.log(`\n📋 Factura: ${factura.invoice_number} (ID: ${factura.id})`)
    console.log(`   Clases asociadas: ${factura.factura_clases?.length || 0}`)
    
    if (factura.factura_clases && factura.factura_clases.length > 0) {
      console.log('   Detalles de clases:')
      factura.factura_clases.forEach((fc, index) => {
        const clase = fc.classes
        console.log(`     ${index + 1}. ID: ${clase.id} | ${clase.subject} | ${clase.date} | status_invoice: ${clase.status_invoice}`)
      })
    }

    // 3. Simular eliminación de factura
    console.log(`\n🗑️ Simulando eliminación de factura ${factura.invoice_number}...`)
    
    // Obtener las clases asociadas ANTES de eliminar la factura
    const { data: clasesFactura, error: clasesFetchError } = await supabase
      .from('factura_clases')
      .select('clase_id')
      .eq('factura_id', factura.id)

    if (clasesFetchError) {
      console.error('❌ Error obteniendo clases de factura:', clasesFetchError)
      return
    }

    console.log(`   Clases encontradas en factura: ${clasesFactura?.length || 0}`)

    if (clasesFactura && clasesFactura.length > 0) {
      const classIds = clasesFactura.map((clase) => clase.clase_id)
      console.log(`   IDs de clases: ${classIds.join(', ')}`)

      // Desmarcar las clases como no facturadas
      console.log('   Desmarcando clases como no facturadas...')
      const { error: unmarkError } = await supabase
        .from('classes')
        .update({ status_invoice: false })
        .in('id', classIds)

      if (unmarkError) {
        console.error('❌ Error desmarcando clases:', unmarkError)
        return
      }

      console.log('✅ Clases desmarcadas exitosamente')

      // Verificar el resultado
      const { data: clasesVerificadas, error: verifyError } = await supabase
        .from('classes')
        .select('id, subject, date, status_invoice')
        .in('id', classIds)

      if (verifyError) {
        console.error('❌ Error verificando clases:', verifyError)
        return
      }

      console.log('\n🔍 Verificación final:')
      clasesVerificadas.forEach(clase => {
        console.log(`   ID: ${clase.id} | ${clase.subject} | ${clase.date} | status_invoice: ${clase.status_invoice}`)
      })

      const clasesAunFacturadas = clasesVerificadas.filter(c => c.status_invoice === true)
      if (clasesAunFacturadas.length === 0) {
        console.log('✅ Todas las clases fueron desmarcadas correctamente')
      } else {
        console.log(`⚠️ ${clasesAunFacturadas.length} clases aún están marcadas como facturadas`)
      }
    }

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar el script
testInvoiceDeletion()
  .then(() => {
    console.log('\n🎉 Prueba completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })
