const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function createCarmenClasses() {
  try {
    console.log('🔧 Creando clases programadas para Carmen López...')

    // Obtener datos de Carmen López
    const studentsResponse = await fetch(`${API_BASE}/students`)
    const students = studentsResponse.ok ? await studentsResponse.json() : []
    
    const carmen = students.find(s => s.first_name === 'Carmen' && s.last_name === 'López')
    
    if (!carmen) {
      console.log('❌ No se encontró a Carmen López')
      return
    }

    console.log(`👤 Encontrada: ${carmen.first_name} ${carmen.last_name} (ID: ${carmen.id})`)
    console.log(`📚 Curso: ${carmen.course_name} (ID: ${carmen.course_id})`)
    console.log(`💰 Precio: €${carmen.course_price}/hora`)

    // Crear clases para Martes y Jueves 19:00-20:30
    const classesToCreate = [
      {
        student_id: carmen.id,
        course_id: carmen.course_id,
        start_time: '19:00',
        end_time: '20:30',
        duration: 90, // 1.5 horas = 90 minutos
        day_of_week: 2, // Martes
        date: getNextOccurrence(2), // Próximo martes
        subject: 'Matemáticas',
        is_recurring: true,
        price: carmen.course_price * 1.5, // 1.5 horas
        notes: 'Horario fijo - Martes'
      },
      {
        student_id: carmen.id,
        course_id: carmen.course_id,
        start_time: '19:00',
        end_time: '20:30',
        duration: 90, // 1.5 horas = 90 minutos
        day_of_week: 4, // Jueves
        date: getNextOccurrence(4), // Próximo jueves
        subject: 'Matemáticas',
        is_recurring: true,
        price: carmen.course_price * 1.5, // 1.5 horas
        notes: 'Horario fijo - Jueves'
      }
    ]

    console.log(`📅 Creando ${classesToCreate.length} clases programadas...`)

    for (const classData of classesToCreate) {
      console.log(`   - ${classData.subject}: Día ${classData.day_of_week} ${classData.start_time}-${classData.end_time} (€${classData.price})`)
      
      const response = await fetch(`${API_BASE}/classes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`   ✅ Clase creada con ID: ${result.id}`)
      } else {
        const error = await response.json()
        console.error(`   ❌ Error creando clase:`, error)
      }
    }

    console.log('🎉 ¡Clases de Carmen López creadas exitosamente!')
    console.log('📅 Ahora aparecerá como "Clase Programada" en el calendario')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Función para obtener la próxima ocurrencia de un día de la semana
function getNextOccurrence(dayOfWeek) {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const targetDay = dayOfWeek === 0 ? 7 : dayOfWeek // Convert to 1-7 format
  
  let daysToAdd = targetDay - currentDay
  if (daysToAdd <= 0) daysToAdd += 7
  
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysToAdd)
  
  return nextDate.toISOString().split('T')[0]
}

createCarmenClasses()
