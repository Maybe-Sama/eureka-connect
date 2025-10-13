#!/usr/bin/env node

/**
 * Script simple para aplicar la migración del campo status_invoice
 * Usa las operaciones directas de Supabase sin SQL personalizado
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migración: Campo status_invoice en tabla classes')
    
    // Verificar si ya existe el campo
    const { data: testData, error: testError } = await supabase
      .from('classes')
      .select('status_invoice')
      .limit(1)

    if (testError && testError.message.includes('column "status_invoice" does not exist')) {
      console.log('⚠️  El campo status_invoice no existe. Necesitas ejecutar la migración SQL primero.')
      console.log('Ejecuta el archivo: database/add-status-invoice-field.sql')
      process.exit(1)
    }

    if (testError) {
      console.error('❌ Error verificando el campo:', testError)
      process.exit(1)
    }

    console.log('✅ El campo status_invoice ya existe')

    // Actualizar todas las clases que tengan status_invoice = null
    console.log('🔄 Actualizando clases con status_invoice = null...')
    
    const { data: nullClasses, error: nullError } = await supabase
      .from('classes')
      .select('id')
      .is('status_invoice', null)

    if (nullError) {
      console.error('❌ Error obteniendo clases con status_invoice null:', nullError)
    } else if (nullClasses && nullClasses.length > 0) {
      console.log(`📊 Encontradas ${nullClasses.length} clases con status_invoice = null`)
      
      const { error: updateError } = await supabase
        .from('classes')
        .update({ status_invoice: false })
        .is('status_invoice', null)

      if (updateError) {
        console.error('❌ Error actualizando clases:', updateError)
      } else {
        console.log('✅ Clases actualizadas exitosamente')
      }
    } else {
      console.log('✅ No hay clases con status_invoice = null')
    }

    // Verificar el estado final
    const { data: allClasses, error: countError } = await supabase
      .from('classes')
      .select('id, status_invoice')

    if (countError) {
      console.error('❌ Error obteniendo conteo final:', countError)
    } else {
      const total = allClasses?.length || 0
      const invoiced = allClasses?.filter(c => c.status_invoice === true).length || 0
      const notInvoiced = allClasses?.filter(c => c.status_invoice === false).length || 0
      const nullStatus = allClasses?.filter(c => c.status_invoice === null).length || 0

      console.log('📊 Estado final de las clases:')
      console.log(`   - Total: ${total}`)
      console.log(`   - Facturadas (true): ${invoiced}`)
      console.log(`   - No facturadas (false): ${notInvoiced}`)
      console.log(`   - Sin estado (null): ${nullStatus}`)

      if (nullStatus > 0) {
        console.log('⚠️  Aún hay clases con status_invoice = null. Ejecuta este script nuevamente.')
      } else {
        console.log('🎉 ¡Migración completada exitosamente!')
        console.log('')
        console.log('📝 Funcionalidades habilitadas:')
        console.log('   ✅ Las clases ya facturadas no aparecerán en nuevas facturas')
        console.log('   ✅ Al eliminar una factura provisional, las clases se desmarcan')
        console.log('   ✅ Sistema de prevención de facturación duplicada activo')
      }
    }

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  }
}

// Ejecutar la migración
applyMigration()
