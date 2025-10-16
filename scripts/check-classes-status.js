#!/usr/bin/env node

/**
 * Script para verificar el estado de las clases y facturas
 * Usa la API existente para verificar el estado
 */

const fetch = require('node-fetch')

const BASE_URL = 'http://localhost:3000'

async function checkClassesStatus() {
  try {
    console.log('🔍 Verificando estado de clases y facturas...')
    
    // 1. Obtener todas las clases
    console.log('\n📚 Obteniendo clases...')
    const classesResponse = await fetch(`${BASE_URL}/api/classes`)
    if (!classesResponse.ok) {
      throw new Error(`Error obteniendo clases: ${classesResponse.status}`)
    }
    const classes = await classesResponse.json()
    
    console.log(`   Total clases: ${classes.length}`)
    
    // 2. Analizar estado de facturación
    const clasesFacturadas = classes.filter(c => c.status_invoice === true)
    const clasesNoFacturadas = classes.filter(c => c.status_invoice !== true)
    const clasesPagadas = classes.filter(c => c.payment_status === 'paid')
    
    console.log(`   Clases marcadas como facturadas: ${clasesFacturadas.length}`)
    console.log(`   Clases NO marcadas como facturadas: ${clasesNoFacturadas.length}`)
    console.log(`   Clases pagadas: ${clasesPagadas.length}`)
    
    // 3. Obtener facturas
    console.log('\n📄 Obteniendo facturas...')
    const invoicesResponse = await fetch(`${BASE_URL}/api/rrsif/facturas`)
    if (!invoicesResponse.ok) {
      throw new Error(`Error obteniendo facturas: ${invoicesResponse.status}`)
    }
    const invoices = await invoicesResponse.json()
    
    console.log(`   Total facturas: ${invoices.length}`)
    
    // 4. Verificar clases que deberían estar disponibles para facturar
    const clasesDisponibles = clasesPagadas.filter(c => c.status_invoice !== true)
    console.log(`\n✅ Clases disponibles para facturar: ${clasesDisponibles.length}`)
    
    if (clasesDisponibles.length > 0) {
      console.log('\n📋 Primeras 5 clases disponibles:')
      clasesDisponibles.slice(0, 5).forEach((clase, index) => {
        console.log(`   ${index + 1}. ID: ${clase.id} | ${clase.subject} | ${clase.date} | €${clase.price}`)
      })
    }
    
    // 5. Verificar clases marcadas como facturadas
    if (clasesFacturadas.length > 0) {
      console.log('\n📋 Primeras 5 clases marcadas como facturadas:')
      clasesFacturadas.slice(0, 5).forEach((clase, index) => {
        console.log(`   ${index + 1}. ID: ${clase.id} | ${clase.subject} | ${clase.date} | €${clase.price}`)
      })
    }
    
    // 6. Usar la API de verificación si existe
    console.log('\n🔧 Ejecutando verificación automática...')
    try {
      const verifyResponse = await fetch(`${BASE_URL}/api/rrsif/verificar-clases`, {
        method: 'POST'
      })
      
      if (verifyResponse.ok) {
        const verifyResult = await verifyResponse.json()
        console.log('✅ Verificación completada:', verifyResult.message)
        if (verifyResult.clasesCorregidas > 0) {
          console.log(`   Clases corregidas: ${verifyResult.clasesCorregidas}`)
        }
      } else {
        console.log('⚠️ API de verificación no disponible')
      }
    } catch (error) {
      console.log('⚠️ Error ejecutando verificación:', error.message)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

// Ejecutar el script
checkClassesStatus()
  .then(() => {
    console.log('\n🎉 Verificación completada')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error ejecutando script:', error)
    process.exit(1)
  })
