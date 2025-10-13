/**
 * Script para limpiar la base de datos de facturas RRSIF
 * Elimina todas las facturas de prueba para empezar limpio
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://chxtanpvjmeygfkeylsh.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function limpiarFacturasRRSIF() {
  try {
    console.log('🧹 Limpiando base de datos de facturas RRSIF...')
    
    // 1. Eliminar clases de facturas primero (por las foreign keys)
    console.log('📋 Eliminando clases de facturas...')
    const { error: errorClases } = await supabase
      .from('factura_clases')
      .delete()
      .neq('id', 0) // Eliminar todas las filas
    
    if (errorClases) {
      console.error('❌ Error eliminando clases de facturas:', errorClases)
    } else {
      console.log('✅ Clases de facturas eliminadas')
    }
    
    // 2. Eliminar facturas RRSIF
    console.log('📄 Eliminando facturas RRSIF...')
    const { error: errorFacturas } = await supabase
      .from('facturas_rrsif')
      .delete()
      .neq('id', '') // Eliminar todas las filas
    
    if (errorFacturas) {
      console.error('❌ Error eliminando facturas RRSIF:', errorFacturas)
    } else {
      console.log('✅ Facturas RRSIF eliminadas')
    }
    
    // 3. Eliminar eventos RRSIF
    console.log('📊 Eliminando eventos RRSIF...')
    const { error: errorEventos } = await supabase
      .from('eventos_rrsif')
      .delete()
      .neq('id', '') // Eliminar todas las filas
    
    if (errorEventos) {
      console.error('❌ Error eliminando eventos RRSIF:', errorEventos)
    } else {
      console.log('✅ Eventos RRSIF eliminados')
    }
    
    console.log('🎉 Base de datos limpiada exitosamente')
    console.log('💡 Ahora puedes generar facturas sin conflictos de numeración')
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar limpieza
limpiarFacturasRRSIF()

