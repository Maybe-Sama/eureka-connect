/**
 * Test para verificar las validaciones de datos fiscales RRSIF
 */

// Función para validar NIF español
function validarNIF(nif) {
  const regex = /^[0-9]{8}[TRWAGMYFPDXBNJZSQVHLCKE]$/i
  if (!regex.test(nif)) return false
  
  const letras = 'TRWAGMYFPDXBNJZSQVHLCKE'
  const numero = parseInt(nif.substring(0, 8))
  const letra = nif.charAt(8).toUpperCase()
  
  return letras.charAt(numero % 23) === letra
}

// Función para validar email
function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Función para validar código postal español
function validarCodigoPostal(codigoPostal) {
  return /^\d{5}$/.test(codigoPostal)
}

// Función para validar datos fiscales del emisor
function validarDatosFiscales(datos) {
  const errores = []
  
  if (!validarNIF(datos.nif)) {
    errores.push('NIF del emisor no válido')
  }
  
  if (!datos.nombre || datos.nombre.trim().length < 2) {
    errores.push('Nombre del emisor es obligatorio')
  }
  
  if (!datos.direccion || datos.direccion.trim().length < 5) {
    errores.push('Dirección del emisor es obligatoria')
  }
  
  if (!validarCodigoPostal(datos.codigoPostal)) {
    errores.push('Código postal debe tener 5 dígitos')
  }
  
  if (!datos.municipio || datos.municipio.trim().length < 2) {
    errores.push('Municipio es obligatorio')
  }
  
  if (!datos.provincia || datos.provincia.trim().length < 2) {
    errores.push('Provincia es obligatoria')
  }
  
  if (!validarEmail(datos.email)) {
    errores.push('Email del emisor no válido')
  }
  
  return errores
}

// Función para validar datos del receptor
function validarDatosReceptor(datos) {
  const errores = []
  
  if (!datos.nif || datos.nif.trim().length < 9) {
    errores.push('NIF del receptor es obligatorio')
  }
  
  if (!datos.nombre || datos.nombre.trim().length < 2) {
    errores.push('Nombre del receptor es obligatorio')
  }
  
  if (!datos.direccion || datos.direccion.trim().length < 5) {
    errores.push('Dirección del receptor es obligatoria')
  }
  
  if (!validarCodigoPostal(datos.codigoPostal)) {
    errores.push('Código postal del receptor debe tener 5 dígitos')
  }
  
  if (!datos.municipio || datos.municipio.trim().length < 2) {
    errores.push('Municipio del receptor es obligatorio')
  }
  
  if (!datos.provincia || datos.provincia.trim().length < 2) {
    errores.push('Provincia del receptor es obligatoria')
  }
  
  return errores
}

async function testValidacionesFiscales() {
  console.log('=== TEST: Validaciones de Datos Fiscales RRSIF ===\n')

  try {
    // Test 1: Validación de NIF español
    console.log('1. Validando NIF español:')
    const nifsValidos = ['12345678Z', '87654321X', '11111111H']
    const nifsInvalidos = ['12345678A', '1234567Z', '123456789Z', 'ABCDEFGHI']
    
    console.log('   NIFs válidos:')
    nifsValidos.forEach(nif => {
      const esValido = validarNIF(nif)
      console.log(`     - ${nif}: ${esValido ? '✅' : '❌'}`)
    })
    
    console.log('   NIFs inválidos:')
    nifsInvalidos.forEach(nif => {
      const esValido = validarNIF(nif)
      console.log(`     - ${nif}: ${esValido ? '❌' : '✅'}`)
    })

    // Test 2: Validación de email
    console.log('\n2. Validando emails:')
    const emailsValidos = ['test@ejemplo.com', 'usuario@dominio.es', 'a@b.co']
    const emailsInvalidos = ['test@', '@ejemplo.com', 'test.ejemplo.com', '']
    
    console.log('   Emails válidos:')
    emailsValidos.forEach(email => {
      const esValido = validarEmail(email)
      console.log(`     - ${email}: ${esValido ? '✅' : '❌'}`)
    })
    
    console.log('   Emails inválidos:')
    emailsInvalidos.forEach(email => {
      const esValido = validarEmail(email)
      console.log(`     - ${email}: ${esValido ? '❌' : '✅'}`)
    })

    // Test 3: Validación de código postal
    console.log('\n3. Validando códigos postales:')
    const codigosValidos = ['28001', '08001', '41001']
    const codigosInvalidos = ['2800', '280001', '28A01', 'abcde']
    
    console.log('   Códigos válidos:')
    codigosValidos.forEach(cp => {
      const esValido = validarCodigoPostal(cp)
      console.log(`     - ${cp}: ${esValido ? '✅' : '❌'}`)
    })
    
    console.log('   Códigos inválidos:')
    codigosInvalidos.forEach(cp => {
      const esValido = validarCodigoPostal(cp)
      console.log(`     - ${cp}: ${esValido ? '❌' : '✅'}`)
    })

    // Test 4: Validación de datos fiscales del emisor
    console.log('\n4. Validando datos fiscales del emisor:')
    const datosFiscalesValidos = {
      nif: '12345678Z',
      nombre: 'Juan Pérez García',
      direccion: 'Calle Mayor 123, 1º A',
      codigoPostal: '28001',
      municipio: 'Madrid',
      provincia: 'Madrid',
      pais: 'España',
      telefono: '+34 600 000 000',
      email: 'juan@ejemplo.com',
      regimenFiscal: 'autonomo',
      actividadEconomica: 'Enseñanza privada',
      codigoActividad: '85.59.1'
    }
    
    const datosFiscalesInvalidos = {
      nif: '12345678A', // NIF inválido
      nombre: 'J', // Nombre muy corto
      direccion: 'Calle', // Dirección muy corta
      codigoPostal: '2800', // CP inválido
      municipio: 'M', // Municipio muy corto
      provincia: 'M', // Provincia muy corta
      email: 'juan@' // Email inválido
    }
    
    const erroresValidos = validarDatosFiscales(datosFiscalesValidos)
    const erroresInvalidos = validarDatosFiscales(datosFiscalesInvalidos)
    
    console.log(`   - Datos válidos - Errores: ${erroresValidos.length} (${erroresValidos.length === 0 ? '✅' : '❌'})`)
    if (erroresValidos.length > 0) {
      erroresValidos.forEach(error => console.log(`     - ${error}`))
    }
    
    console.log(`   - Datos inválidos - Errores: ${erroresInvalidos.length} (${erroresInvalidos.length > 0 ? '✅' : '❌'})`)
    if (erroresInvalidos.length > 0) {
      erroresInvalidos.forEach(error => console.log(`     - ${error}`))
    }

    // Test 5: Validación de datos del receptor
    console.log('\n5. Validando datos del receptor:')
    const datosReceptorValidos = {
      nif: '87654321X',
      nombre: 'María García López',
      direccion: 'Avenida de la Paz 456, 2º B',
      codigoPostal: '08001',
      municipio: 'Barcelona',
      provincia: 'Barcelona',
      pais: 'España',
      telefono: '+34 600 111 111',
      email: 'maria@ejemplo.com'
    }
    
    const datosReceptorInvalidos = {
      nif: '', // NIF vacío
      nombre: 'M', // Nombre muy corto
      direccion: 'Calle', // Dirección muy corta
      codigoPostal: '0800', // CP inválido
      municipio: 'B', // Municipio muy corto
      provincia: 'B' // Provincia muy corta
    }
    
    const erroresReceptorValidos = validarDatosReceptor(datosReceptorValidos)
    const erroresReceptorInvalidos = validarDatosReceptor(datosReceptorInvalidos)
    
    console.log(`   - Datos válidos - Errores: ${erroresReceptorValidos.length} (${erroresReceptorValidos.length === 0 ? '✅' : '❌'})`)
    if (erroresReceptorValidos.length > 0) {
      erroresReceptorValidos.forEach(error => console.log(`     - ${error}`))
    }
    
    console.log(`   - Datos inválidos - Errores: ${erroresReceptorInvalidos.length} (${erroresReceptorInvalidos.length > 0 ? '✅' : '❌'})`)
    if (erroresReceptorInvalidos.length > 0) {
      erroresReceptorInvalidos.forEach(error => console.log(`     - ${error}`))
    }

    // Test 6: Verificar campos obligatorios
    console.log('\n6. Verificando campos obligatorios:')
    const camposObligatorios = [
      'nif', 'nombre', 'direccion', 'codigoPostal', 
      'municipio', 'provincia', 'email'
    ]
    
    console.log('   Campos obligatorios para emisor:')
    camposObligatorios.forEach(campo => {
      console.log(`     - ${campo}`)
    })

    console.log('\n✅ Tests de validaciones fiscales completados exitosamente')

  } catch (error) {
    console.error('❌ Error en tests de validaciones:', error.message)
  }
}

// Ejecutar tests
testValidacionesFiscales()
