const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function fixCarmenSchedule() {
  try {
    console.log('🔧 Corrigiendo horario de Carmen López...')

    // Obtener datos actuales de Carmen López
    const studentsResponse = await fetch(`${API_BASE}/students`)
    const students = studentsResponse.ok ? await studentsResponse.json() : []
    
    const carmen = students.find(s => s.first_name === 'Carmen' && s.last_name === 'López')
    
    if (!carmen) {
      console.log('❌ No se encontró a Carmen López')
      return
    }

    console.log(`👤 Encontrada: ${carmen.first_name} ${carmen.last_name} (ID: ${carmen.id})`)
    console.log(`📅 Horario actual:`, carmen.fixed_schedule)

    // Crear el horario correcto: Martes (2) y Jueves (4) a las 19:00-20:30
    const correctSchedule = [
      {
        day_of_week: 2, // Martes
        start_time: '19:00',
        end_time: '20:30',
        subject: 'Matemáticas'
      },
      {
        day_of_week: 4, // Jueves
        start_time: '19:00',
        end_time: '20:30',
        subject: 'Matemáticas'
      }
    ]

    console.log(`✅ Nuevo horario:`, correctSchedule)

    // Actualizar el horario fijo de Carmen
    const updateResponse = await fetch(`${API_BASE}/students/${carmen.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fixed_schedule: JSON.stringify(correctSchedule)
      })
    })

    if (updateResponse.ok) {
      console.log('✅ Horario de Carmen López actualizado correctamente')
      console.log('📅 Nuevo horario: Martes y Jueves 19:00-20:30 (Matemáticas)')
    } else {
      const error = await updateResponse.json()
      console.error('❌ Error actualizando horario:', error)
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixCarmenSchedule()
