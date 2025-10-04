// Script simple para agregar horarios fijos usando fetch a la API local
const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function addFixedSchedules() {
  try {
    console.log('🔄 Agregando horarios fijos de ejemplo...')

    // Obtener estudiantes existentes
    const studentsResponse = await fetch(`${API_BASE}/students`)
    if (!studentsResponse.ok) {
      console.error('❌ Error obteniendo estudiantes:', studentsResponse.statusText)
      return
    }

    const students = await studentsResponse.json()
    
    if (!students || students.length === 0) {
      console.log('⚠️ No hay estudiantes en la base de datos')
      return
    }

    console.log(`📚 Encontrados ${students.length} estudiantes`)

    // Ejemplos de horarios fijos
    const fixedSchedules = [
      // Estudiante 1: Lunes y Miércoles de 16:00 a 17:00
      {
        student_id: students[0].id,
        fixed_schedule: JSON.stringify([
          {
            day_of_week: 1, // Lunes
            start_time: '16:00',
            end_time: '17:00',
            subject: 'Matemáticas'
          },
          {
            day_of_week: 3, // Miércoles
            start_time: '16:00',
            end_time: '17:00',
            subject: 'Matemáticas'
          }
        ])
      },
      // Estudiante 2: Martes y Jueves de 17:30 a 18:30
      {
        student_id: students[1]?.id,
        fixed_schedule: students[1] ? JSON.stringify([
          {
            day_of_week: 2, // Martes
            start_time: '17:30',
            end_time: '18:30',
            subject: 'Física'
          },
          {
            day_of_week: 4, // Jueves
            start_time: '17:30',
            end_time: '18:30',
            subject: 'Física'
          }
        ]) : null
      },
      // Estudiante 3: Viernes de 15:00 a 16:00
      {
        student_id: students[2]?.id,
        fixed_schedule: students[2] ? JSON.stringify([
          {
            day_of_week: 5, // Viernes
            start_time: '15:00',
            end_time: '16:00',
            subject: 'Química'
          }
        ]) : null
      }
    ]

    // Actualizar estudiantes con horarios fijos
    for (const schedule of fixedSchedules) {
      if (schedule.fixed_schedule) {
        try {
          const updateResponse = await fetch(`${API_BASE}/students/${schedule.student_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fixed_schedule: schedule.fixed_schedule
            })
          })

          if (updateResponse.ok) {
            console.log(`✅ Horario fijo agregado para estudiante ${schedule.student_id}`)
          } else {
            console.error(`❌ Error actualizando estudiante ${schedule.student_id}:`, updateResponse.statusText)
          }
        } catch (error) {
          console.error(`❌ Error actualizando estudiante ${schedule.student_id}:`, error.message)
        }
      }
    }

    console.log('🎉 ¡Horarios fijos agregados exitosamente!')
    console.log('\n📋 Resumen de horarios agregados:')
    console.log('• Estudiante 1: Lunes y Miércoles 16:00-17:00 (Matemáticas)')
    console.log('• Estudiante 2: Martes y Jueves 17:30-18:30 (Física)')
    console.log('• Estudiante 3: Viernes 15:00-16:00 (Química)')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Verificar si el servidor está corriendo
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/students`)
    return response.ok
  } catch (error) {
    return false
  }
}

async function main() {
  console.log('🔍 Verificando si el servidor está corriendo...')
  
  const serverRunning = await checkServer()
  if (!serverRunning) {
    console.log('❌ El servidor no está corriendo. Por favor ejecuta "pnpm dev" primero.')
    return
  }

  console.log('✅ Servidor detectado, procediendo...')
  await addFixedSchedules()
}

main()


