import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Ejecutando migración: añadir receptor_tipo_identificacion...')
    
    // Ejecutar la migración SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE facturas_rrsif 
        ADD COLUMN IF NOT EXISTS receptor_tipo_identificacion TEXT DEFAULT 'DNI';
      `
    })
    
    if (error) {
      console.error('❌ Error ejecutando migración:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Error al añadir el campo receptor_tipo_identificacion'
      })
    }
    
    console.log('✅ Migración ejecutada exitosamente')
    
    // Verificar que el campo se añadió correctamente
    const { data: facturas, error: verifyError } = await supabase
      .from('facturas_rrsif')
      .select('receptor_tipo_identificacion')
      .limit(1)
    
    if (verifyError) {
      console.error('❌ Error verificando migración:', verifyError)
      return NextResponse.json({
        success: false,
        error: verifyError.message,
        details: 'Error al verificar la migración'
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Campo receptor_tipo_identificacion añadido exitosamente',
      verification: facturas && facturas.length > 0 ? 'Campo verificado' : 'No hay facturas para verificar'
    })
    
  } catch (err) {
    console.error('❌ Error en migración:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    })
  }
}
