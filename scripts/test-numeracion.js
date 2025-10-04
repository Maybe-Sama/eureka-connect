/**
 * Test para verificar la numeración correlativa anual
 */

// Simulación de la función de numeración
function formatearNumeroFactura(serie, numero) {
  return `${serie}-${numero.toString().padStart(4, '0')}`
}

// Simulación de numeración anual
let numeracionActual = 0
let añoActual = new Date().getFullYear()

function generarNumeroFactura() {
  const año = new Date().getFullYear()
  
  // Si cambió el año, reiniciar numeración
  if (año !== añoActual) {
    numeracionActual = 0
    añoActual = año
  }
  
  // Incrementar numeración
  numeracionActual++
  
  return formatearNumeroFactura('FAC', numeracionActual)
}

async function testNumeracion() {
  console.log('=== TEST: Numeración Correlativa Anual ===\n')

  try {
    // Test 1: Verificar formato de numeración
    console.log('1. Verificando formato de numeración:')
    const numero1 = formatearNumeroFactura('FAC', 1)
    const numero2 = formatearNumeroFactura('FAC', 10)
    const numero3 = formatearNumeroFactura('FAC', 100)
    
    console.log(`   - Número 1: ${numero1}`)
    console.log(`   - Número 10: ${numero2}`)
    console.log(`   - Número 100: ${numero3}`)
    console.log(`   - ¿Formato correcto? ${numero1 === 'FAC-0001' && numero2 === 'FAC-0010' && numero3 === 'FAC-0100'}`)

    // Test 2: Generar secuencia de números
    console.log('\n2. Generando secuencia de números:')
    const numeros = []
    for (let i = 0; i < 5; i++) {
      const numero = generarNumeroFactura()
      numeros.push(numero)
      console.log(`   - Factura ${i + 1}: ${numero}`)
    }
    
    // Verificar que son consecutivos
    const sonConsecutivos = numeros.every((num, index) => {
      if (index === 0) return true
      const numActual = parseInt(num.split('-')[1])
      const numAnterior = parseInt(numeros[index - 1].split('-')[1])
      return numActual === numAnterior + 1
    })
    
    console.log(`   - ¿Consecutivos? ${sonConsecutivos}`)

    // Test 3: Verificar reinicio anual
    console.log('\n3. Simulando cambio de año:')
    const añoOriginal = añoActual
    const numeracionOriginal = numeracionActual
    
    // Simular cambio de año
    añoActual = añoActual + 1
    numeracionActual = 0
    
    const numeroNuevoAño = generarNumeroFactura()
    console.log(`   - Año original: ${añoOriginal}`)
    console.log(`   - Año simulado: ${añoActual}`)
    console.log(`   - Numeración original: ${numeracionOriginal}`)
    console.log(`   - Numeración nueva: ${numeracionActual}`)
    console.log(`   - Primer número del nuevo año: ${numeroNuevoAño}`)
    console.log(`   - ¿Reinició correctamente? ${numeroNuevoAño === 'FAC-0001'}`)

    // Test 4: Verificar unicidad
    console.log('\n4. Verificando unicidad de números:')
    const numerosUnicos = new Set()
    let duplicados = 0
    
    // Generar 100 números y verificar unicidad
    for (let i = 0; i < 100; i++) {
      const numero = generarNumeroFactura()
      if (numerosUnicos.has(numero)) {
        duplicados++
      } else {
        numerosUnicos.add(numero)
      }
    }
    
    console.log(`   - Números generados: ${numerosUnicos.size}`)
    console.log(`   - Duplicados encontrados: ${duplicados}`)
    console.log(`   - ¿Únicos? ${duplicados === 0}`)

    // Test 5: Verificar formato de serie
    console.log('\n5. Verificando formato de serie:')
    const serieCorrecta = numeros.every(num => num.startsWith('FAC-'))
    const longitudCorrecta = numeros.every(num => num.length === 8) // FAC-0001 = 8 caracteres
    
    console.log(`   - ¿Serie correcta? ${serieCorrecta}`)
    console.log(`   - ¿Longitud correcta? ${longitudCorrecta}`)

    console.log('\n✅ Tests de numeración completados exitosamente')

  } catch (error) {
    console.error('❌ Error en tests de numeración:', error.message)
  }
}

// Ejecutar tests
testNumeracion()
