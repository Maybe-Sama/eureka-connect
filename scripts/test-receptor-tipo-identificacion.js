// Script para probar si el campo receptor_tipo_identificacion existe en Supabase
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testReceptorTipoIdentificacion() {
  try {
    console.log('🔍 Verificando si existe el campo receptor_tipo_identificacion...')
    
    // Intentar obtener una factura para ver la estructura
    const { data: facturas, error } = await supabase
      .from('facturas_rrsif')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error obteniendo facturas:', error)
      return
    }
    
    if (facturas && facturas.length > 0) {
      const factura = facturas[0]
      console.log('✅ Factura encontrada:', factura.id)
      console.log('📋 Campos disponibles:', Object.keys(factura))
      
      if ('receptor_tipo_identificacion' in factura) {
        console.log('✅ Campo receptor_tipo_identificacion existe')
        console.log('📄 Valor:', factura.receptor_tipo_identificacion)
      } else {
        console.log('❌ Campo receptor_tipo_identificacion NO existe')
        console.log('🔧 Necesitamos añadir el campo a la tabla')
      }
    } else {
      console.log('ℹ️ No hay facturas en la base de datos')
    }
    
  } catch (err) {
    console.error('❌ Error:', err)
  }
}

testReceptorTipoIdentificacion()
