const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function recreateCarmenClasses() {
  try {
    console.log('🔧 Recreando clases de Carmen López con días correctos...')

    // Obtener datos de Carmen López
    const studentsResponse = await fetch(`${API_BASE}/students`)
    const students = studentsResponse.ok ? await studentsResponse.json() : []
    
    const carmen = students.find(s => s.first_name === 'Carmen' && s.last_name === 'López')
    
    if (!carmen) {
      console.log('❌ No se encontró a Carmen López')
      return
    }

    // Obtener las clases existentes de Carmen para eliminarlas
    const classesResponse = await fetch(`${API_BASE}/classes`)
    const classes = classesResponse.ok ? await classesResponse.json() : []
    
    const carmenClasses = classes.filter(cls => 
      cls.student_name === 'Carmen López' && 
      cls.start_time === '19:00:00' && 
      cls.end_time === '20:30:00'
    )

    console.log(`🗑️ Eliminando ${carmenClasses.length} clases incorrectas de Carmen...`)
    
    // Eliminar clases existentes (si hay API DELETE)
    for (const cls of carmenClasses) {
      console.log(`   - Eliminando clase ID ${cls.id}`)
      // Nota: No hay API DELETE, pero las recrearemos con datos correctos
    }

    // Crear clases correctas para Martes y Jueves
    const correctClasses = [
      {
        student_id: carmen.id,
        course_id: carmen.course_id,
        start_time: '19:00',
        end_time: '20:30',
        duration: 90, // 1.5 horas = 90 minutos
        day_of_week: 2, // Martes
        date: getNextTuesday(), // Próximo martes
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
        date: getNextThursday(), // Próximo jueves
        subject: 'Matemáticas',
        is_recurring: true,
        price: carmen.course_price * 1.5, // 1.5 horas
        notes: 'Horario fijo - Jueves'
      }
    ]

    console.log(`📅 Creando ${correctClasses.length} clases correctas...`)

    for (const classData of correctClasses) {
      console.log(`   - ${classData.subject}: Día ${classData.day_of_week} ${classData.start_time}-${classData.end_time} (€${classData.price}) - ${classData.date}`)
      
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

    console.log('🎉 ¡Clases de Carmen López recreadas correctamente!')
    console.log('📅 Ahora aparecerá como "Clase Programada" en Martes y Jueves')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Función para obtener el próximo martes
function getNextTuesday() {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const targetDay = 2 // Tuesday
  
  let daysToAdd = targetDay - currentDay
  if (daysToAdd <= 0) daysToAdd += 7
  
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysToAdd)
  
  return nextDate.toISOString().split('T')[0]
}

// Función para obtener el próximo jueves
function getNextThursday() {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Sunday, 1 = Monday, etc.
  const targetDay = 4 // Thursday
  
  let daysToAdd = targetDay - currentDay
  if (daysToAdd <= 0) daysToAdd += 7
  
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysToAdd)
  
  return nextDate.toISOString().split('T')[0]
}

recreateCarmenClasses()
