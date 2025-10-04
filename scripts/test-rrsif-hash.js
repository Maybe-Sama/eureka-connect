/**
 * Test para verificar el sistema de hash y encadenamiento SHA-256
 */

const crypto = require('crypto-js')

// Simular función de hash
function generarHashSHA256(data) {
  const jsonString = JSON.stringify(data, Object.keys(data).sort())
  return crypto.SHA256(jsonString).toString()
}

// Test 1: Generación de hash básico
console.log('=== TEST 1: Generación de Hash SHA-256 ===')
const datosTest = {
  nif_emisor: '12345678A',
  nombre_emisor: 'Juan Pérez',
  nif_receptor: '87654321B',
  nombre_receptor: 'María García',
  serie: 'FAC',
  numero: '0001',
  fecha_expedicion: '2025-01-15T10:30:00Z',
  importe_total: 150.00
}

const hash1 = generarHashSHA256(datosTest)
console.log('Hash generado:', hash1)
console.log('Longitud del hash:', hash1.length)
console.log('¿Es SHA-256?', hash1.length === 64)

// Test 2: Encadenamiento de hashes
console.log('\n=== TEST 2: Encadenamiento de Hashes ===')
const registro1 = {
  id: 'reg1',
  hash_registro: hash1,
  hash_registro_anterior: null,
  timestamp: Date.now()
}

const registro2 = {
  id: 'reg2',
  hash_registro: '',
  hash_registro_anterior: hash1,
  timestamp: Date.now() + 1000
}

// Calcular hash del segundo registro
registro2.hash_registro = generarHashSHA256({
  ...datosTest,
  numero: '0002',
  hash_anterior: hash1
})

console.log('Registro 1 hash:', registro1.hash_registro)
console.log('Registro 2 hash:', registro2.hash_registro)
console.log('¿Encadenamiento correcto?', registro2.hash_registro_anterior === registro1.hash_registro)

// Test 3: Detección de modificaciones
console.log('\n=== TEST 3: Detección de Modificaciones ===')
const datosModificados = { ...datosTest, importe_total: 200.00 }
const hashModificado = generarHashSHA256(datosModificados)
console.log('Hash original:', hash1)
console.log('Hash modificado:', hashModificado)
console.log('¿Diferentes?', hash1 !== hashModificado)

// Test 4: Consistencia del hash
console.log('\n=== TEST 4: Consistencia del Hash ===')
const hash2 = generarHashSHA256(datosTest)
const hash3 = generarHashSHA256(datosTest)
console.log('Hash 1:', hash1)
console.log('Hash 2:', hash2)
console.log('Hash 3:', hash3)
console.log('¿Consistentes?', hash1 === hash2 && hash2 === hash3)

console.log('\n✅ Tests de Hash SHA-256 completados')
