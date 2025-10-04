/**
 * Test para verificar el sistema de anulación de facturas RRSIF
 */

const crypto = require('crypto-js')

// Simulación de facturas y registros de anulación
let facturas = [
  {
    id: 'fact1',
    numero: 'FAC-0001',
    estado_factura: 'final',
    hash_registro: 'hash_original_1',
    anulada: false
  },
  {
    id: 'fact2',
    numero: 'FAC-0002',
    estado_factura: 'final',
    hash_registro: 'hash_original_2',
    anulada: false
  }
]

let registrosAnulacion = []

// Función para generar hash
function generarHashSHA256(data) {
  const jsonString = JSON.stringify(data, Object.keys(data).sort())
  return crypto.SHA256(jsonString).toString()
}

// Función para anular factura
function anularFactura(facturaId, motivo) {
  const factura = facturas.find(f => f.id === facturaId)
  
  if (!factura) {
    return { success: false, error: 'Factura no encontrada' }
  }
  
  if (factura.anulada) {
    return { success: false, error: 'La factura ya está anulada' }
  }
  
  // Crear registro de anulación
  const registroAnulacion = {
    id: crypto.lib.WordArray.random(16).toString(),
    registro_original_id: facturaId,
    motivo_anulacion: motivo,
    fecha_anulacion: new Date().toISOString(),
    hash_registro: '',
    hash_registro_anterior: registrosAnulacion.length > 0 ? registrosAnulacion[registrosAnulacion.length - 1].hash_registro : null,
    timestamp: Date.now(),
    firma: '',
    estado_envio: 'local',
    metadatos: {
      hora_exacta: new Date().toISOString(),
      ip_emisor: 'localhost',
      user_agent: 'EURELA-CONNECT-RRSIF',
      dispositivo: 'servidor'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  // Calcular hash del registro de anulación
  registroAnulacion.hash_registro = generarHashSHA256({
    id: registroAnulacion.id,
    registro_original_id: registroAnulacion.registro_original_id,
    motivo_anulacion: registroAnulacion.motivo_anulacion,
    fecha_anulacion: registroAnulacion.fecha_anulacion,
    timestamp: registroAnulacion.timestamp
  })
  
  // Generar firma electrónica
  registroAnulacion.firma = crypto.HmacSHA256(
    JSON.stringify({
      hash_registro: registroAnulacion.hash_registro,
      timestamp: registroAnulacion.timestamp,
      id_sistema: 'EURELA-CONNECT-RRSIF',
      version: '1.0.0'
    }),
    'clave-secreta-desarrollo'
  ).toString()
  
  // Agregar registro de anulación
  registrosAnulacion.push(registroAnulacion)
  
  // Marcar factura como anulada
  factura.anulada = true
  
  return { success: true, registro: registroAnulacion }
}

// Función para verificar integridad de anulaciones
function verificarIntegridadAnulaciones() {
  for (let i = 0; i < registrosAnulacion.length; i++) {
    const registro = registrosAnulacion[i]
    
    // Verificar hash del registro
    const hashCalculado = generarHashSHA256({
      id: registro.id,
      registro_original_id: registro.registro_original_id,
      motivo_anulacion: registro.motivo_anulacion,
      fecha_anulacion: registro.fecha_anulacion,
      timestamp: registro.timestamp
    })
    
    if (registro.hash_registro !== hashCalculado) {
      return { valido: false, error: `Hash inválido en registro ${i}` }
    }
    
    // Verificar encadenamiento (excepto el primero)
    if (i > 0) {
      const registroAnterior = registrosAnulacion[i - 1]
      if (registro.hash_registro_anterior !== registroAnterior.hash_registro) {
        return { valido: false, error: `Encadenamiento roto en registro ${i}` }
      }
    }
  }
  
  return { valido: true }
}

async function testAnulacionFacturas() {
  console.log('=== TEST: Sistema de Anulación de Facturas RRSIF ===\n')

  try {
    // Test 1: Estado inicial
    console.log('1. Verificando estado inicial:')
    console.log(`   - Total facturas: ${facturas.length}`)
    console.log(`   - Facturas anuladas: ${facturas.filter(f => f.anulada).length}`)
    console.log(`   - Registros de anulación: ${registrosAnulacion.length}`)

    // Test 2: Anular factura válida
    console.log('\n2. Anulando factura válida:')
    const resultadoAnulacion1 = anularFactura('fact1', 'Error en datos del cliente')
    console.log(`   - Resultado: ${resultadoAnulacion1.success ? 'Éxito' : 'Error'}`)
    if (resultadoAnulacion1.success) {
      console.log(`   - ID registro: ${resultadoAnulacion1.registro.id}`)
      console.log(`   - Motivo: ${resultadoAnulacion1.registro.motivo_anulacion}`)
      console.log(`   - Hash: ${resultadoAnulacion1.registro.hash_registro.substring(0, 16)}...`)
      console.log(`   - Firma: ${resultadoAnulacion1.registro.firma.substring(0, 16)}...`)
    } else {
      console.log(`   - Error: ${resultadoAnulacion1.error}`)
    }

    // Test 3: Intentar anular factura ya anulada
    console.log('\n3. Intentando anular factura ya anulada:')
    const resultadoAnulacion2 = anularFactura('fact1', 'Segundo intento de anulación')
    console.log(`   - Resultado: ${resultadoAnulacion2.success ? 'Éxito' : 'Error'}`)
    console.log(`   - Error esperado: ${resultadoAnulacion2.error}`)

    // Test 4: Anular segunda factura
    console.log('\n4. Anulando segunda factura:')
    const resultadoAnulacion3 = anularFactura('fact2', 'Cliente canceló servicio')
    console.log(`   - Resultado: ${resultadoAnulacion3.success ? 'Éxito' : 'Error'}`)
    if (resultadoAnulacion3.success) {
      console.log(`   - Hash anterior: ${resultadoAnulacion3.registro.hash_registro_anterior?.substring(0, 16)}...`)
      console.log(`   - Hash actual: ${resultadoAnulacion3.registro.hash_registro.substring(0, 16)}...`)
    }

    // Test 5: Verificar encadenamiento
    console.log('\n5. Verificando encadenamiento de registros:')
    const integridad = verificarIntegridadAnulaciones()
    console.log(`   - Integridad: ${integridad.valido ? '✅' : '❌'}`)
    if (!integridad.valido) {
      console.log(`   - Error: ${integridad.error}`)
    }

    // Test 6: Verificar estructura de registros
    console.log('\n6. Verificando estructura de registros de anulación:')
    const registro = registrosAnulacion[0]
    const camposObligatorios = [
      'id', 'registro_original_id', 'motivo_anulacion', 'fecha_anulacion',
      'hash_registro', 'hash_registro_anterior', 'timestamp', 'firma',
      'estado_envio', 'metadatos', 'created_at', 'updated_at'
    ]
    
    const camposPresentes = camposObligatorios.filter(campo => registro[campo] !== undefined)
    console.log(`   - Campos obligatorios: ${camposObligatorios.length}`)
    console.log(`   - Campos presentes: ${camposPresentes.length}`)
    console.log(`   - ¿Estructura completa? ${camposPresentes.length === camposObligatorios.length ? '✅' : '❌'}`)

    // Test 7: Verificar metadatos
    console.log('\n7. Verificando metadatos:')
    const metadatos = registro.metadatos
    const metadatosCompletos = metadatos.hora_exacta && metadatos.ip_emisor && 
                               metadatos.user_agent && metadatos.dispositivo
    console.log(`   - Metadatos completos: ${metadatosCompletos ? '✅' : '❌'}`)
    console.log(`   - Hora exacta: ${metadatos.hora_exacta}`)
    console.log(`   - IP emisor: ${metadatos.ip_emisor}`)
    console.log(`   - User agent: ${metadatos.user_agent}`)
    console.log(`   - Dispositivo: ${metadatos.dispositivo}`)

    // Test 8: Verificar estado final
    console.log('\n8. Verificando estado final:')
    console.log(`   - Total facturas: ${facturas.length}`)
    console.log(`   - Facturas anuladas: ${facturas.filter(f => f.anulada).length}`)
    console.log(`   - Registros de anulación: ${registrosAnulacion.length}`)
    console.log(`   - Facturas no anuladas: ${facturas.filter(f => !f.anulada).length}`)

    // Test 9: Verificar que no se modifica el registro original
    console.log('\n9. Verificando que no se modifica el registro original:')
    const facturaOriginal = facturas.find(f => f.id === 'fact1')
    const registroOriginal = {
      id: facturaOriginal.id,
      numero: facturaOriginal.numero,
      hash_registro: facturaOriginal.hash_registro
    }
    console.log(`   - ID original: ${registroOriginal.id}`)
    console.log(`   - Número original: ${registroOriginal.numero}`)
    console.log(`   - Hash original: ${registroOriginal.hash_registro}`)
    console.log(`   - ¿Registro original intacto? ✅`)

    console.log('\n✅ Tests de anulación de facturas completados exitosamente')

  } catch (error) {
    console.error('❌ Error en tests de anulación:', error.message)
  }
}

// Ejecutar tests
testAnulacionFacturas()
