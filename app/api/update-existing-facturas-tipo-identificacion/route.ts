import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Actualizando facturas existentes con tipo de identificación correcto...')
    
    // Obtener todas las facturas que necesitan actualización
    const { data: facturas, error: fetchError } = await supabase
      .from('facturas_rrsif')
      .select('id, receptor_nif, receptor_tipo_identificacion')
      .order('created_at', { ascending: false })
      .limit(10) // Solo las últimas 10 para no sobrecargar
    
    if (fetchError) {
      console.error('❌ Error obteniendo facturas:', fetchError)
      return NextResponse.json({
        success: false,
        error: fetchError.message
      })
    }
    
    console.log(`📋 Encontradas ${facturas?.length || 0} facturas para revisar`)
    
    if (!facturas || facturas.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay facturas para actualizar'
      })
    }
    
    // Mostrar información de las facturas
    const facturasInfo = facturas.map(f => ({
      id: f.id,
      receptor_nif: f.receptor_nif,
      receptor_tipo_identificacion: f.receptor_tipo_identificacion
    }))
    
    console.log('📄 Facturas encontradas:', facturasInfo)
    
    return NextResponse.json({
      success: true,
      message: 'Facturas obtenidas para revisión',
      facturas: facturasInfo,
      total: facturas.length
    })
    
  } catch (err) {
    console.error('❌ Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    })
  }
}
