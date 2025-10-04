const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function deleteCarmenIncorrectClasses() {
  try {
    console.log('🗑️ Eliminando clases incorrectas de Carmen López...')

    // Obtener todas las clases
    const classesResponse = await fetch(`${API_BASE}/classes`)
    const classes = classesResponse.ok ? await classesResponse.json() : []
    
    // Filtrar clases incorrectas de Carmen (Día 1 - Domingo)
    const incorrectClasses = classes.filter(cls => 
      cls.student_name === 'Carmen López' && 
      cls.start_time === '19:00:00' && 
      cls.end_time === '20:30:00' &&
      cls.day_of_week === 1 // Solo Día 1 (Domingo)
    )

    console.log(`📅 Encontradas ${incorrectClasses.length} clases incorrectas de Carmen (Día 1):`)
    incorrectClasses.forEach((cls, index) => {
      console.log(`   ${index + 1}. ID: ${cls.id}, Día: ${cls.day_of_week} (Domingo), Fecha: ${cls.date}`)
    })

    if (incorrectClasses.length === 0) {
      console.log('✅ No hay clases incorrectas que eliminar')
      return
    }

    // Preparar IDs para eliminar
    const classIds = incorrectClasses.map(cls => cls.id)
    const idsParam = classIds.join(',')

    console.log(`\n🗑️ Eliminando ${classIds.length} clases incorrectas...`)

    // Eliminar clases usando la API DELETE
    const deleteResponse = await fetch(`${API_BASE}/classes?ids=${idsParam}`, {
      method: 'DELETE'
    })

    if (deleteResponse.ok) {
      const result = await deleteResponse.json()
      console.log(`✅ ${result.message}`)
      console.log('📅 Carmen López ahora solo tiene clases en Martes y Jueves')
    } else {
      const error = await deleteResponse.json()
      console.error('❌ Error eliminando clases:', error)
    }

    // Verificar el resultado
    console.log('\n🔍 Verificando resultado...')
    const verifyResponse = await fetch(`${API_BASE}/classes`)
    const updatedClasses = verifyResponse.ok ? await verifyResponse.json() : []
    
    const carmenClasses = updatedClasses.filter(cls => 
      cls.student_name === 'Carmen López' && 
      cls.start_time === '19:00:00' && 
      cls.end_time === '20:30:00'
    )

    console.log(`📊 Carmen López ahora tiene ${carmenClasses.length} clases:`)
    carmenClasses.forEach((cls, index) => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][cls.day_of_week - 1] || 'Desconocido'
      console.log(`   ${index + 1}. ID: ${cls.id}, Día: ${cls.day_of_week} (${dayName})`)
    })

    // Verificar que solo tiene Martes y Jueves
    const correctDays = carmenClasses.every(cls => cls.day_of_week === 2 || cls.day_of_week === 4)
    if (correctDays && carmenClasses.length === 2) {
      console.log('✅ ¡Perfecto! Carmen López solo tiene clases en Martes y Jueves')
    } else {
      console.log('⚠️ Carmen López aún tiene clases en días incorrectos')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

deleteCarmenIncorrectClasses()
