#!/usr/bin/env node

/**
 * Script para probar la funcionalidad de clases liberadas
 */

const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3000'

async function testLiberatedClasses() {
  try {
    console.log('🔍 Probando funcionalidad de clases liberadas...')
    
    // 1. Obtener todas las clases
    console.log('\n📚 Obteniendo clases...')
    const classesResponse = await fetch(`${BASE_URL}/api/classes`)
    if (!classesResponse.ok) {
      throw new Error(`Error obteniendo clases: ${classesResponse.status}`)
    }
    const classes = await classesResponse.json()
    
    console.log(`   Total clases: ${classes.length}`)
    
    // 2. Encontrar clases marcadas como facturadas
    const clasesFacturadas = classes.filter(c => c.status_invoice === true)
    console.log(`   Clases marcadas como facturadas: ${clasesFacturadas.length}`)
    
    if (clasesFacturadas.length === 0) {
      console.log('ℹ️ No hay clases facturadas para probar')
      return
    }
    
    // 3. Seleccionar una clase facturada para liberar
    const claseParaLiberar = clasesFacturadas[0]
    console.log(`\n🔓 Liberando clase ID: ${claseParaLiberar.id}`)
    console.log(`   Asignatura: ${claseParaLiberar.subject}`)
    console.log(`   Fecha: ${claseParaLiberar.date}`)
    
    // 4. Liberar la clase
    const liberarResponse = await fetch(`${BASE_URL}/api/classes/update-invoice-status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        classId: claseParaLiberar.id,
        statusInvoice: false
      }),
    })
    
    if (!liberarResponse.ok) {
      const error = await liberarResponse.json()
      throw new Error(`Error liberando clase: ${error.error}`)
    }
    
    const liberarResult = await liberarResponse.json()
    console.log('✅ Clase liberada:', liberarResult.message)
    
    // 5. Verificar que la clase está disponible
    console.log('\n🔍 Verificando que la clase está disponible...')
    const classesResponse2 = await fetch(`${BASE_URL}/api/classes`)
    const classes2 = await classesResponse2.json()
    
    const claseLiberada = classes2.find(c => c.id === claseParaLiberar.id)
    if (claseLiberada) {
      console.log(`   Status_invoice: ${claseLiberada.status_invoice}`)
      console.log(`   Payment_status: ${claseLiberada.payment_status}`)
      
      if (claseLiberada.status_invoice === false) {
        console.log('✅ Clase liberada correctamente')
      } else {
        console.log('❌ La clase no se liberó correctamente')
      }
    } else {
      console.log('❌ No se encontró la clase liberada')
    }
    
    // 6. Probar generación de factura con la clase liberada
    console.log('\n🧾 Probando generación de factura con clase liberada...')
    
    // Obtener datos fiscales de prueba
    const configResponse = await fetch(`${BASE_URL}/api/rrsif/configuracion-fiscal`)
    if (!configResponse.ok) {
      console.log('⚠️ No hay configuración fiscal, saltando prueba de factura')
      return
    }
    
    const configData = await configResponse.json()
    if (!configData.success || !configData.configuracion) {
      console.log('⚠️ No hay configuración fiscal válida, saltando prueba de factura')
      return
    }
    
    const datosFiscales = configData.configuracion.datos_fiscales
    const datosReceptor = {
      nif: '12345678A',
      nombre: 'Test Student',
      direccion: 'Calle Test 123',
      codigoPostal: '28001',
      municipio: 'Madrid',
      provincia: 'Madrid',
      pais: 'España',
      telefono: '600123456',
      email: 'test@example.com'
    }
    
    const facturaResponse = await fetch(`${BASE_URL}/api/rrsif/generar-factura`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: claseParaLiberar.student_id,
        clasesIds: [claseParaLiberar.id],
        datosFiscales,
        datosReceptor,
        descripcion: 'Prueba de clase liberada',
        incluirQR: false
      }),
    })
    
    if (facturaResponse.ok) {
      const facturaResult = await facturaResponse.json()
      console.log('✅ Factura generada exitosamente con clase liberada')
      console.log(`   Número de factura: ${facturaResult.factura?.invoiceNumber}`)
    } else {
      const error = await facturaResponse.json()
      console.log('❌ Error generando factura:', error.error)
      console.log('   Detalles:', error.details)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Ejecutar el script
testLiberatedClasses()
  .then(() => {
    console.log('\n🎉 Prueba completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })
