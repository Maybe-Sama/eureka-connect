const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3001/api'

async function testCalendarUnification() {
  try {
    console.log('🧪 Probando unificación de celdas del calendario...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n📊 Análisis de clases para unificación:')
    
    // Analizar cada clase
    classes.forEach((cls, index) => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][cls.day_of_week - 1] || 'Desconocido'
      const duration = cls.duration || 0
      const timeSlots = Math.ceil(duration / 30) // Cada franja es de 30 minutos
      
      console.log(`\n${index + 1}. ${cls.student_name} - ${dayName}`)
      console.log(`   ⏰ Horario: ${cls.start_time} - ${cls.end_time}`)
      console.log(`   📏 Duración: ${duration} minutos`)
      console.log(`   🔢 Franjas: ${timeSlots} (${timeSlots === 1 ? 'Sin unificar' : 'Necesita unificación'})`)
      
      if (timeSlots > 1) {
        console.log(`   ✅ Esta clase debería aparecer como un bloque unificado de ${timeSlots} franjas`)
      }
    })

    // Verificar clases que necesitan unificación
    const classesNeedingUnification = classes.filter(cls => {
      const duration = cls.duration || 0
      return Math.ceil(duration / 30) > 1
    })

    console.log(`\n🎯 Resumen:`)
    console.log(`   - Total de clases: ${classes.length}`)
    console.log(`   - Clases que necesitan unificación: ${classesNeedingUnification.length}`)
    
    if (classesNeedingUnification.length > 0) {
      console.log(`\n✅ Las siguientes clases deberían aparecer como bloques unificados:`)
      classesNeedingUnification.forEach(cls => {
        const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][cls.day_of_week - 1]
        const timeSlots = Math.ceil((cls.duration || 0) / 30)
        console.log(`   - ${cls.student_name} (${dayName}): ${timeSlots} franjas`)
      })
    } else {
      console.log(`\n⚠️ No hay clases que necesiten unificación (todas son de 30 minutos o menos)`)
    }

    console.log('\n🌐 El calendario está disponible en: http://localhost:3001/calendar')
    console.log('📱 Verifica visualmente que las clases aparezcan como bloques unificados')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testCalendarUnification()