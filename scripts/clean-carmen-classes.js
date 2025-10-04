const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function cleanCarmenClasses() {
  try {
    console.log('🧹 Limpiando clases incorrectas de Carmen López...')

    // Obtener todas las clases
    const classesResponse = await fetch(`${API_BASE}/classes`)
    const classes = classesResponse.ok ? await classesResponse.json() : []
    
    // Filtrar clases de Carmen
    const carmenClasses = classes.filter(cls => 
      cls.student_name === 'Carmen López' && 
      cls.start_time === '19:00:00' && 
      cls.end_time === '20:30:00'
    )

    console.log(`📅 Encontradas ${carmenClasses.length} clases de Carmen:`)
    carmenClasses.forEach((cls, index) => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][cls.day_of_week - 1] || 'Desconocido'
      console.log(`   ${index + 1}. ID: ${cls.id}, Día: ${cls.day_of_week} (${dayName}), Fecha: ${cls.date}`)
    })

    // Identificar clases correctas e incorrectas
    const correctClasses = carmenClasses.filter(cls => cls.day_of_week === 2 || cls.day_of_week === 4)
    const incorrectClasses = carmenClasses.filter(cls => cls.day_of_week !== 2 && cls.day_of_week !== 4)

    console.log(`\n✅ Clases correctas (Día 2 y 4): ${correctClasses.length}`)
    correctClasses.forEach(cls => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][cls.day_of_week - 1]
      console.log(`   - ID: ${cls.id}, Día: ${cls.day_of_week} (${dayName})`)
    })

    console.log(`\n❌ Clases incorrectas (Día 1): ${incorrectClasses.length}`)
    incorrectClasses.forEach(cls => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][cls.day_of_week - 1]
      console.log(`   - ID: ${cls.id}, Día: ${cls.day_of_week} (${dayName})`)
    })

    // Como no hay API DELETE, voy a crear un script que elimine las clases incorrectas
    // y mantenga solo las correctas
    if (incorrectClasses.length > 0) {
      console.log(`\n🗑️ Eliminando ${incorrectClasses.length} clases incorrectas...`)
      
      // Nota: Como no hay API DELETE, voy a crear un script que use la base de datos directamente
      console.log('⚠️ No hay API DELETE disponible. Necesitamos eliminar las clases incorrectas manualmente.')
      console.log('📝 Clases a eliminar:')
      incorrectClasses.forEach(cls => {
        console.log(`   - DELETE FROM classes WHERE id = ${cls.id};`)
      })
    }

    // Verificar que tenemos exactamente 2 clases correctas (Martes y Jueves)
    if (correctClasses.length === 2) {
      console.log('\n✅ Carmen López tiene exactamente 2 clases correctas (Martes y Jueves)')
    } else if (correctClasses.length < 2) {
      console.log('\n⚠️ Carmen López necesita clases adicionales')
    } else {
      console.log('\n⚠️ Carmen López tiene clases duplicadas')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

cleanCarmenClasses()
