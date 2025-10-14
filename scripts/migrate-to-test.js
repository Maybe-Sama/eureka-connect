#!/usr/bin/env node

/**
 * Script para migrar datos de la base de datos de desarrollo a la de test
 * 
 * Uso:
 * 1. Configura las variables de entorno en .env.local
 * 2. Ejecuta: node scripts/migrate-to-test.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Configuración de colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Verificar variables de entorno
function checkEnvironment() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL_TEST',
    'SUPABASE_SERVICE_ROLE_KEY_TEST'
  ]
  
  const missing = requiredVars.filter(varName => !process.env[varName])
  
  if (missing.length > 0) {
    log(`❌ Variables de entorno faltantes: ${missing.join(', ')}`, 'red')
    log('', 'reset')
    log('Agrega estas variables a tu .env.local:', 'yellow')
    log('', 'reset')
    log('# Base de datos de desarrollo (actual)', 'cyan')
    log('NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-dev.supabase.co', 'cyan')
    log('SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_dev', 'cyan')
    log('', 'reset')
    log('# Base de datos de test (nueva)', 'cyan')
    log('NEXT_PUBLIC_SUPABASE_URL_TEST=https://tu-proyecto-test.supabase.co', 'cyan')
    log('SUPABASE_SERVICE_ROLE_KEY_TEST=tu_service_role_key_test', 'cyan')
    process.exit(1)
  }
}

// Cliente de desarrollo (origen)
const devSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Cliente de test (destino)
const testSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_TEST,
  process.env.SUPABASE_SERVICE_ROLE_KEY_TEST
)

// Función para migrar una tabla
async function migrateTable(tableName, options = {}) {
  const { 
    orderBy = 'id', 
    select = '*', 
    transform = (data) => data,
    dependencies = []
  } = options
  
  try {
    log(`📦 Migrando tabla: ${tableName}`, 'blue')
    
    // Verificar dependencias
    for (const dep of dependencies) {
      const { data: depData } = await testSupabase.from(dep).select('id').limit(1)
      if (!depData || depData.length === 0) {
        log(`⚠️  Dependencia ${dep} no encontrada en test. Saltando ${tableName}...`, 'yellow')
        return { success: false, reason: `Missing dependency: ${dep}` }
      }
    }
    
    // Obtener datos de desarrollo
    const { data: sourceData, error: sourceError } = await devSupabase
      .from(tableName)
      .select(select)
      .order(orderBy)
    
    if (sourceError) {
      log(`❌ Error obteniendo datos de ${tableName}: ${sourceError.message}`, 'red')
      return { success: false, error: sourceError }
    }
    
    if (!sourceData || sourceData.length === 0) {
      log(`ℹ️  No hay datos en ${tableName}`, 'yellow')
      return { success: true, count: 0 }
    }
    
    // Transformar datos si es necesario
    const transformedData = transform(sourceData)
    
    // Limpiar tabla de destino (opcional)
    if (options.clearFirst) {
      const { error: deleteError } = await testSupabase
        .from(tableName)
        .delete()
        .neq('id', 0) // Eliminar todos los registros
      
      if (deleteError) {
        log(`⚠️  No se pudo limpiar ${tableName}: ${deleteError.message}`, 'yellow')
      }
    }
    
    // Insertar datos en test
    const { data: insertedData, error: insertError } = await testSupabase
      .from(tableName)
      .insert(transformedData)
      .select()
    
    if (insertError) {
      log(`❌ Error insertando en ${tableName}: ${insertError.message}`, 'red')
      return { success: false, error: insertError }
    }
    
    log(`✅ ${tableName}: ${insertedData.length} registros migrados`, 'green')
    return { success: true, count: insertedData.length }
    
  } catch (error) {
    log(`❌ Error inesperado en ${tableName}: ${error.message}`, 'red')
    return { success: false, error }
  }
}

// Función principal de migración
async function migrateData() {
  log('🚀 Iniciando migración de datos de desarrollo a test...', 'bright')
  log('', 'reset')
  
  // Verificar entorno
  checkEnvironment()
  
  const results = []
  
  try {
    // 1. Migrar cursos (sin dependencias)
    results.push(await migrateTable('courses', {
      clearFirst: true
    }))
    
    // 2. Migrar estudiantes (depende de courses)
    results.push(await migrateTable('students', {
      dependencies: ['courses'],
      clearFirst: true
    }))
    
    // 3. Migrar clases (depende de students)
    results.push(await migrateTable('classes', {
      dependencies: ['students'],
      clearFirst: true
    }))
    
    // 4. Migrar facturas (depende de students)
    results.push(await migrateTable('invoices', {
      dependencies: ['students'],
      clearFirst: true
    }))
    
    // 5. Migrar facturas RRSIF (si existe)
    results.push(await migrateTable('facturas_rrsif', {
      clearFirst: true
    }))
    
    // 6. Migrar configuraciones (si existe)
    results.push(await migrateTable('settings', {
      clearFirst: true
    }))
    
    // 7. Migrar avatares (si existe)
    results.push(await migrateTable('avatars', {
      clearFirst: true
    }))
    
    // Resumen de resultados
    log('', 'reset')
    log('📊 RESUMEN DE MIGRACIÓN:', 'bright')
    log('=' .repeat(50), 'cyan')
    
    let totalMigrated = 0
    let totalErrors = 0
    
    results.forEach((result, index) => {
      if (result.success) {
        log(`✅ Tabla ${index + 1}: ${result.count} registros`, 'green')
        totalMigrated += result.count
      } else {
        log(`❌ Tabla ${index + 1}: Error - ${result.error?.message || result.reason}`, 'red')
        totalErrors++
      }
    })
    
    log('', 'reset')
    log(`📈 Total migrado: ${totalMigrated} registros`, 'green')
    log(`❌ Errores: ${totalErrors}`, totalErrors > 0 ? 'red' : 'green')
    
    if (totalErrors === 0) {
      log('', 'reset')
      log('🎉 ¡Migración completada exitosamente!', 'green')
      log('', 'reset')
      log('Próximos pasos:', 'yellow')
      log('1. Verifica los datos en tu proyecto de test', 'cyan')
      log('2. Actualiza las variables de entorno para usar test', 'cyan')
      log('3. Prueba la aplicación con la base de datos de test', 'cyan')
    } else {
      log('', 'reset')
      log('⚠️  Migración completada con errores. Revisa los logs arriba.', 'yellow')
    }
    
  } catch (error) {
    log(`❌ Error crítico durante la migración: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Ejecutar migración
if (require.main === module) {
  migrateData()
    .then(() => {
      log('', 'reset')
      log('✨ Script finalizado', 'magenta')
      process.exit(0)
    })
    .catch((error) => {
      log(`💥 Error fatal: ${error.message}`, 'red')
      process.exit(1)
    })
}

module.exports = { migrateData, migrateTable }
