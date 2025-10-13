#!/usr/bin/env node

/**
 * Script de migración para agregar el campo status_invoice a la tabla classes
 * Este script debe ejecutarse después de aplicar la migración SQL
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function migrateStatusInvoice() {
  try {
    console.log('🚀 Iniciando migración: Agregar campo status_invoice a la tabla classes')
    
    // Verificar si el campo ya existe
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'classes')
      .eq('column_name', 'status_invoice')

    if (columnsError) {
      console.log('⚠️  No se pudo verificar si el campo existe, continuando...')
    } else if (columns && columns.length > 0) {
      console.log('✅ El campo status_invoice ya existe en la tabla classes')
      return
    }

    // Leer y ejecutar el script SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'add-status-invoice-field.sql')
    
    if (!fs.existsSync(sqlPath)) {
      console.error('❌ Error: No se encontró el archivo SQL de migración')
      console.error(`Ruta esperada: ${sqlPath}`)
      process.exit(1)
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    console.log('📄 Ejecutando script SQL...')
    
    // Dividir el script en comandos individuales
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))

    for (const command of commands) {
      if (command.trim()) {
        console.log(`  → Ejecutando: ${command.substring(0, 50)}...`)
        
        const { error } = await supabase.rpc('exec_sql', { sql: command })
        
        if (error) {
          console.error(`❌ Error ejecutando comando: ${command}`)
          console.error(`Error: ${error.message}`)
          // Continuar con el siguiente comando
        } else {
          console.log(`  ✅ Comando ejecutado exitosamente`)
        }
      }
    }

    // Verificar que el campo se agregó correctamente
    const { data: updatedColumns, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_name', 'classes')
      .eq('column_name', 'status_invoice')

    if (verifyError) {
      console.log('⚠️  No se pudo verificar el campo después de la migración')
    } else if (updatedColumns && updatedColumns.length > 0) {
      console.log('✅ Campo status_invoice agregado exitosamente:')
      console.log(`   - Tipo: ${updatedColumns[0].data_type}`)
      console.log(`   - Valor por defecto: ${updatedColumns[0].column_default}`)
    } else {
      console.error('❌ El campo status_invoice no se encontró después de la migración')
      process.exit(1)
    }

    // Actualizar todas las clases existentes para que tengan status_invoice = false
    console.log('🔄 Actualizando clases existentes...')
    
    const { error: updateError } = await supabase
      .from('classes')
      .update({ status_invoice: false })
      .is('status_invoice', null)

    if (updateError) {
      console.error('❌ Error actualizando clases existentes:', updateError)
    } else {
      console.log('✅ Clases existentes actualizadas con status_invoice = false')
    }

    // Verificar el resultado final
    const { data: classesCount, error: countError } = await supabase
      .from('classes')
      .select('id, status_invoice', { count: 'exact' })

    if (countError) {
      console.log('⚠️  No se pudo verificar el conteo final de clases')
    } else {
      const totalClasses = classesCount?.length || 0
      const invoicedClasses = classesCount?.filter(c => c.status_invoice === true).length || 0
      const notInvoicedClasses = classesCount?.filter(c => c.status_invoice === false).length || 0
      
      console.log('📊 Resumen final:')
      console.log(`   - Total de clases: ${totalClasses}`)
      console.log(`   - Clases facturadas: ${invoicedClasses}`)
      console.log(`   - Clases no facturadas: ${notInvoicedClasses}`)
    }

    console.log('🎉 Migración completada exitosamente!')
    console.log('')
    console.log('📝 Próximos pasos:')
    console.log('   1. Reinicia el servidor de desarrollo')
    console.log('   2. Verifica que las facturas funcionen correctamente')
    console.log('   3. Las clases ya facturadas no aparecerán en nuevas facturas')

  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  }
}

// Ejecutar la migración
migrateStatusInvoice()
