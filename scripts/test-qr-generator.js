/**
 * Test para verificar la generación de códigos QR según RRSIF
 */

const QRCode = require('qrcode')

// Configuración QR según RRSIF
const QR_CONFIG = {
  TAMANO_MM: { min: 30, max: 40 },
  DPI: 300,
  MARGEN: 4,
  COLOR: {
    dark: '#000000',
    light: '#FFFFFF'
  },
  ERROR_CORRECTION_LEVEL: 'M'
}

// Función para convertir mm a píxeles
function mmToPx(mm, dpi = QR_CONFIG.DPI) {
  return Math.round((mm * dpi) / 25.4)
}

// Función para calcular tamaño óptimo
function calcularTamanoOptimoQR(tamanoMM = QR_CONFIG.TAMANO_MM.max) {
  const tamanoPx = mmToPx(tamanoMM)
  const minPx = mmToPx(QR_CONFIG.TAMANO_MM.min)
  const maxPx = mmToPx(QR_CONFIG.TAMANO_MM.max)
  return Math.max(minPx, Math.min(maxPx, tamanoPx))
}

// Función para generar contenido QR
function generarContenidoQR(registro) {
  const datosQR = {
    hash: registro.hash_registro,
    nif_emisor: registro.nif_emisor,
    numero: registro.numero,
    serie: registro.serie,
    fecha: registro.fecha_expedicion,
    importe: registro.importe_total,
    url: registro.url_verificacion_qr,
    timestamp: registro.timestamp,
    version: '1.0'
  }
  return JSON.stringify(datosQR)
}

async function testQRGeneration() {
  console.log('=== TEST: Generación de Códigos QR RRSIF ===\n')

  // Datos de prueba
  const registroTest = {
    hash_registro: '269d0d86ec3559a33f8849586aff94b92ebf6a4d3860d9ca799d062704225d02',
    nif_emisor: '12345678A',
    numero: '0001',
    serie: 'FAC',
    fecha_expedicion: '2025-01-15T10:30:00Z',
    importe_total: 150.00,
    url_verificacion_qr: 'https://verificacion.eurela-connect.com/verificar?hash=test',
    timestamp: Date.now()
  }

  try {
    // Test 1: Verificar tamaños según RRSIF
    console.log('1. Verificando tamaños según RRSIF:')
    const tamanoMinPx = mmToPx(QR_CONFIG.TAMANO_MM.min)
    const tamanoMaxPx = mmToPx(QR_CONFIG.TAMANO_MM.max)
    const tamanoOptimo = calcularTamanoOptimoQR()
    
    console.log(`   - Tamaño mínimo: ${QR_CONFIG.TAMANO_MM.min}mm = ${tamanoMinPx}px`)
    console.log(`   - Tamaño máximo: ${QR_CONFIG.TAMANO_MM.max}mm = ${tamanoMaxPx}px`)
    console.log(`   - Tamaño óptimo: ${tamanoOptimo}px`)
    console.log(`   - ¿Dentro del rango? ${tamanoMinPx <= tamanoOptimo && tamanoOptimo <= tamanoMaxPx}`)

    // Test 2: Generar contenido QR
    console.log('\n2. Generando contenido QR:')
    const contenidoQR = generarContenidoQR(registroTest)
    console.log(`   - Contenido: ${contenidoQR.substring(0, 100)}...`)
    console.log(`   - Longitud: ${contenidoQR.length} caracteres`)

    // Test 3: Generar QR como data URL
    console.log('\n3. Generando QR como data URL:')
    const qrDataURL = await QRCode.toDataURL(contenidoQR, {
      width: tamanoOptimo,
      margin: QR_CONFIG.MARGEN,
      color: QR_CONFIG.COLOR,
      errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION_LEVEL,
      type: 'image/png',
      quality: 1.0
    })
    
    console.log(`   - Data URL generado: ${qrDataURL.substring(0, 50)}...`)
    console.log(`   - ¿Es PNG? ${qrDataURL.startsWith('data:image/png;base64,')}`)
    console.log(`   - Longitud: ${qrDataURL.length} caracteres`)

    // Test 4: Generar QR como buffer
    console.log('\n4. Generando QR como buffer:')
    const qrBuffer = await QRCode.toBuffer(contenidoQR, {
      width: tamanoOptimo,
      margin: QR_CONFIG.MARGEN,
      color: QR_CONFIG.COLOR,
      errorCorrectionLevel: QR_CONFIG.ERROR_CORRECTION_LEVEL,
      type: 'png'
    })
    
    console.log(`   - Buffer generado: ${qrBuffer.length} bytes`)
    console.log(`   - ¿Es PNG? ${qrBuffer[0] === 0x89 && qrBuffer[1] === 0x50 && qrBuffer[2] === 0x4E && qrBuffer[3] === 0x47}`)

    // Test 5: Verificar contenido del QR
    console.log('\n5. Verificando contenido del QR:')
    const contieneHash = contenidoQR.includes(registroTest.hash_registro)
    const contieneNIF = contenidoQR.includes(registroTest.nif_emisor)
    const contieneNumero = contenidoQR.includes(registroTest.numero)
    const contieneSerie = contenidoQR.includes(registroTest.serie)
    
    console.log(`   - ¿Contiene hash? ${contieneHash}`)
    console.log(`   - ¿Contiene NIF? ${contieneNIF}`)
    console.log(`   - ¿Contiene número? ${contieneNumero}`)
    console.log(`   - ¿Contiene serie? ${contieneSerie}`)
    console.log(`   - ¿Contenido completo? ${contieneHash && contieneNIF && contieneNumero && contieneSerie}`)

    console.log('\n✅ Tests de QR completados exitosamente')

  } catch (error) {
    console.error('❌ Error en tests de QR:', error.message)
  }
}

// Ejecutar tests
testQRGeneration()
