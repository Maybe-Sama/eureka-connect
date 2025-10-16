#!/usr/bin/env node

/**
 * Script para probar la factura con desglose detallado
 */

const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3000'

async function testDetailedInvoice() {
  try {
    console.log('🧾 Probando factura con desglose detallado...')
    
    // 1. Obtener clases disponibles
    console.log('\n📚 Obteniendo clases...')
    const classesResponse = await fetch(`${BASE_URL}/api/classes`)
    if (!classesResponse.ok) {
      throw new Error(`Error obteniendo clases: ${classesResponse.status}`)
    }
    const classes = await classesResponse.json()
    
    console.log(`   Total clases: ${classes.length}`)
    
    // 2. Filtrar clases pagadas
    const clasesPagadas = classes.filter(c => c.payment_status === 'paid')
    console.log(`   Clases pagadas: ${clasesPagadas.length}`)
    
    if (clasesPagadas.length === 0) {
      console.log('ℹ️ No hay clases pagadas para probar')
      return
    }
    
    // 3. Seleccionar múltiples clases para probar el desglose
    const clasesParaFacturar = clasesPagadas.slice(0, Math.min(3, clasesPagadas.length))
    console.log(`\n📋 Clases seleccionadas para facturar: ${clasesParaFacturar.length}`)
    
    clasesParaFacturar.forEach((clase, index) => {
      console.log(`   ${index + 1}. ${clase.subject} - ${clase.date} ${clase.start_time}-${clase.end_time} (${clase.duration} min) - €${clase.price}`)
    })
    
    // 4. Obtener configuración fiscal
    console.log('\n⚙️ Obteniendo configuración fiscal...')
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
    
    // 5. Generar factura con desglose detallado
    console.log('\n🧾 Generando factura con desglose detallado...')
    
    const facturaResponse = await fetch(`${BASE_URL}/api/rrsif/generar-factura`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: clasesParaFacturar[0].student_id,
        clasesIds: clasesParaFacturar.map(c => c.id),
        datosFiscales,
        datosReceptor,
        descripcion: `Clases particulares - ${clasesParaFacturar.length} clase${clasesParaFacturar.length !== 1 ? 's' : ''}`,
        incluirQR: false
      }),
    })
    
    if (facturaResponse.ok) {
      const facturaResult = await facturaResponse.json()
      console.log('✅ Factura generada exitosamente')
      console.log(`   Número de factura: ${facturaResult.factura?.invoiceNumber}`)
      console.log(`   Total: €${facturaResult.factura?.registro_facturacion?.importe_total}`)
      
      // Mostrar desglose de clases
      if (facturaResult.factura?.classes) {
        console.log('\n📊 Desglose de clases en la factura:')
        facturaResult.factura.classes.forEach((clase, index) => {
          const duracionHoras = clase.duracion / 60
          const precioPorHora = duracionHoras > 0 ? clase.precio / duracionHoras : 0
        console.log(`   ${index + 1}. ${clase.asignatura} - ${clase.fecha}`)
        // Formatear hora sin segundos
        const formatearHora = (hora) => {
          if (hora && hora.includes(':') && hora.split(':').length === 3) {
            return hora.substring(0, 5)
          }
          return hora
        }
        console.log(`      Hora: ${formatearHora(clase.hora_inicio)}-${formatearHora(clase.hora_fin)}`)
        console.log(`      Duración: ${duracionHoras.toFixed(1)}h`)
        console.log(`      Precio/h: €${precioPorHora.toFixed(2)}`)
        console.log(`      Total: €${clase.precio}`)
        })
      }
      
      // 6. Generar PDF para verificar el desglose visual
      console.log('\n📄 Generando PDF...')
      const pdfResponse = await fetch(`${BASE_URL}/api/rrsif/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          factura: facturaResult.factura,
          incluirQR: false
        }),
      })
      
      if (pdfResponse.ok) {
        console.log('✅ PDF generado exitosamente')
        console.log('   El PDF debería mostrar cada clase individualmente con:')
        console.log('   - Fecha de cada clase')
        console.log('   - Duración en horas')
        console.log('   - Precio por hora calculado')
        console.log('   - Total por clase')
        console.log('   - Resumen total al final (con "---" en precio/h)')
      } else {
        console.log('⚠️ Error generando PDF:', pdfResponse.status)
      }
      
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
testDetailedInvoice()
  .then(() => {
    console.log('\n🎉 Prueba completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })
