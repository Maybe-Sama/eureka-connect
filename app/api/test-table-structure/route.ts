import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Verificando estructura de la tabla facturas_rrsif...')
    
    // Intentar obtener una factura para ver la estructura
    const { data: facturas, error } = await supabase
      .from('facturas_rrsif')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error obteniendo facturas:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: 'Error al acceder a la tabla facturas_rrsif'
      })
    }
    
    if (facturas && facturas.length > 0) {
      const factura = facturas[0]
      const campos = Object.keys(factura)
      
      console.log('✅ Factura encontrada:', factura.id)
      console.log('📋 Campos disponibles:', campos)
      
      const tieneReceptorTipoIdentificacion = 'receptor_tipo_identificacion' in factura
      
      return NextResponse.json({
        success: true,
        facturaId: factura.id,
        campos: campos,
        tieneReceptorTipoIdentificacion,
        receptorTipoIdentificacion: factura.receptor_tipo_identificacion || 'No definido',
        receptorNif: factura.receptor_nif || 'No definido'
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'No hay facturas en la base de datos',
        campos: [],
        tieneReceptorTipoIdentificacion: false
      })
    }
    
  } catch (err) {
    console.error('❌ Error:', err)
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido'
    })
  }
}
