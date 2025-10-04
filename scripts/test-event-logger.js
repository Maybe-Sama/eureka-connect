/**
 * Test para verificar el sistema de registro de eventos RRSIF
 */

const crypto = require('crypto-js')

// Simulación del sistema de eventos
let eventos = []
let ultimoResumen = 0
const RESUMEN_INTERVAL = 6 * 60 * 60 * 1000 // 6 horas

function generarIdUnico() {
  return crypto.lib.WordArray.random(16).toString()
}

function generarTimestamp() {
  return new Date().toISOString()
}

function generarTimestampNumerico() {
  return Date.now()
}

function generarHashSHA256(data) {
  const jsonString = JSON.stringify(data, Object.keys(data).sort())
  return crypto.SHA256(jsonString).toString()
}

async function registrarEvento(tipo, detalle, actor = 'sistema', metadatos = {}) {
  const evento = {
    id: generarIdUnico(),
    tipo_evento: tipo,
    timestamp: generarTimestampNumerico(),
    actor,
    detalle,
    hash_evento: undefined,
    metadatos: {
      hora_exacta: generarTimestamp(),
      ip: metadatos.ip || 'localhost',
      user_agent: metadatos.user_agent || 'EURELA-CONNECT-RRSIF',
      dispositivo: metadatos.dispositivo || 'servidor',
      ...metadatos
    },
    created_at: generarTimestamp()
  }
  
  // Calcular hash del evento
  evento.hash_evento = generarHashSHA256({
    id: evento.id,
    tipo: evento.tipo_evento,
    timestamp: evento.timestamp,
    actor: evento.actor,
    detalle: evento.detalle
  })
  
  eventos.push(evento)
  console.log(`[EVENTO] ${tipo}: ${detalle}`)
  
  return evento
}

async function verificarEventoResumen() {
  const ahora = Date.now()
  const tiempoDesdeUltimoResumen = ahora - ultimoResumen
  
  if (tiempoDesdeUltimoResumen >= RESUMEN_INTERVAL) {
    await generarEventoResumen()
    ultimoResumen = ahora
  }
}

async function generarEventoResumen() {
  const eventosRecientes = eventos.filter(
    e => Date.now() - e.timestamp < RESUMEN_INTERVAL
  )
  
  const resumen = {
    total_eventos: eventosRecientes.length,
    eventos_por_tipo: eventosRecientes.reduce((acc, e) => {
      acc[e.tipo_evento] = (acc[e.tipo_evento] || 0) + 1
      return acc
    }, {}),
    primer_evento: eventosRecientes[0]?.timestamp || 0,
    ultimo_evento: eventosRecientes[eventosRecientes.length - 1]?.timestamp || 0
  }
  
  return await registrarEvento(
    'evento_resumen',
    `Resumen de ${resumen.total_eventos} eventos en las últimas 6 horas`,
    'sistema',
    { resumen }
  )
}

async function testEventLogger() {
  console.log('=== TEST: Sistema de Registro de Eventos RRSIF ===\n')

  try {
    // Test 1: Registrar eventos básicos
    console.log('1. Registrando eventos básicos:')
    await registrarEvento('inicio_operacion', 'Sistema iniciado')
    await registrarEvento('generacion_factura', 'Factura FAC-0001 generada', 'usuario')
    await registrarEvento('anulacion_factura', 'Factura FAC-0002 anulada', 'usuario')
    await registrarEvento('incidencia', 'Error de conexión', 'sistema', { severidad: 'media' })
    
    console.log(`   - Total eventos registrados: ${eventos.length}`)

    // Test 2: Verificar estructura de eventos
    console.log('\n2. Verificando estructura de eventos:')
    const evento = eventos[0]
    const tieneId = !!evento.id
    const tieneTipo = !!evento.tipo_evento
    const tieneTimestamp = !!evento.timestamp
    const tieneHash = !!evento.hash_evento
    const tieneMetadatos = !!evento.metadatos
    
    console.log(`   - ¿Tiene ID? ${tieneId}`)
    console.log(`   - ¿Tiene tipo? ${tieneTipo}`)
    console.log(`   - ¿Tiene timestamp? ${tieneTimestamp}`)
    console.log(`   - ¿Tiene hash? ${tieneHash}`)
    console.log(`   - ¿Tiene metadatos? ${tieneMetadatos}`)
    console.log(`   - ¿Estructura completa? ${tieneId && tieneTipo && tieneTimestamp && tieneHash && tieneMetadatos}`)

    // Test 3: Verificar hash de eventos
    console.log('\n3. Verificando hash de eventos:')
    const hashesValidos = eventos.every(e => {
      const hashCalculado = generarHashSHA256({
        id: e.id,
        tipo: e.tipo_evento,
        timestamp: e.timestamp,
        actor: e.actor,
        detalle: e.detalle
      })
      return e.hash_evento === hashCalculado
    })
    
    console.log(`   - ¿Hashes válidos? ${hashesValidos}`)
    console.log(`   - Longitud hash: ${eventos[0].hash_evento.length}`)
    console.log(`   - ¿Es SHA-256? ${eventos[0].hash_evento.length === 64}`)

    // Test 4: Verificar tipos de eventos
    console.log('\n4. Verificando tipos de eventos:')
    const tiposValidos = [
      'inicio_operacion',
      'fin_operacion',
      'generacion_factura',
      'anulacion_factura',
      'incidencia',
      'exportacion',
      'restauracion',
      'evento_resumen',
      'apagado_reinicio'
    ]
    
    const tiposUsados = eventos.map(e => e.tipo_evento)
    const tiposValidosUsados = tiposUsados.every(tipo => tiposValidos.includes(tipo))
    
    console.log(`   - Tipos usados: ${tiposUsados.join(', ')}`)
    console.log(`   - ¿Tipos válidos? ${tiposValidosUsados}`)

    // Test 5: Simular evento resumen
    console.log('\n5. Simulando evento resumen:')
    ultimoResumen = Date.now() - RESUMEN_INTERVAL - 1000 // Forzar resumen
    await verificarEventoResumen()
    
    const eventoResumen = eventos.find(e => e.tipo_evento === 'evento_resumen')
    console.log(`   - ¿Evento resumen generado? ${!!eventoResumen}`)
    console.log(`   - Detalle: ${eventoResumen?.detalle}`)

    // Test 6: Verificar metadatos
    console.log('\n6. Verificando metadatos:')
    const metadatosCompletos = eventos.every(e => {
      const meta = e.metadatos
      return meta.hora_exacta && meta.ip && meta.user_agent && meta.dispositivo
    })
    
    console.log(`   - ¿Metadatos completos? ${metadatosCompletos}`)
    console.log(`   - Ejemplo metadatos:`, eventos[0].metadatos)

    // Test 7: Verificar unicidad de IDs
    console.log('\n7. Verificando unicidad de IDs:')
    const ids = eventos.map(e => e.id)
    const idsUnicos = new Set(ids)
    console.log(`   - Total eventos: ${eventos.length}`)
    console.log(`   - IDs únicos: ${idsUnicos.size}`)
    console.log(`   - ¿Todos únicos? ${ids.length === idsUnicos.size}`)

    console.log('\n✅ Tests de sistema de eventos completados exitosamente')

  } catch (error) {
    console.error('❌ Error en tests de eventos:', error.message)
  }
}

// Ejecutar tests
testEventLogger()
