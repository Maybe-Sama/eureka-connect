const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Configuración de la base de datos SQLite local
const dbPath = path.join(__dirname, '..', 'database', 'crm.db')
const db = new sqlite3.Database(dbPath)

function addFixedSchedules() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Agregando horarios fijos de ejemplo...')

    // Obtener estudiantes existentes
    db.all('SELECT id, first_name, last_name FROM students LIMIT 3', (err, students) => {
      if (err) {
        console.error('❌ Error obteniendo estudiantes:', err)
        reject(err)
        return
      }

      if (!students || students.length === 0) {
        console.log('⚠️ No hay estudiantes en la base de datos')
        resolve()
        return
      }

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

      let completed = 0
      const total = fixedSchedules.filter(s => s.fixed_schedule).length

      if (total === 0) {
        console.log('⚠️ No hay estudiantes para actualizar')
        resolve()
        return
      }

      // Actualizar estudiantes con horarios fijos
      fixedSchedules.forEach(schedule => {
        if (schedule.fixed_schedule) {
          db.run(
            'UPDATE students SET fixed_schedule = ? WHERE id = ?',
            [schedule.fixed_schedule, schedule.student_id],
            function(err) {
              if (err) {
                console.error(`❌ Error actualizando estudiante ${schedule.student_id}:`, err)
              } else {
                console.log(`✅ Horario fijo agregado para estudiante ${schedule.student_id}`)
              }
              
              completed++
              if (completed === total) {
                console.log('🎉 ¡Horarios fijos agregados exitosamente!')
                console.log('\n📋 Resumen de horarios agregados:')
                console.log('• Estudiante 1: Lunes y Miércoles 16:00-17:00 (Matemáticas)')
                console.log('• Estudiante 2: Martes y Jueves 17:30-18:30 (Física)')
                console.log('• Estudiante 3: Viernes 15:00-16:00 (Química)')
                resolve()
              }
            }
          )
        }
      })
    })
  })
}

addFixedSchedules()
  .then(() => {
    console.log('✅ Script completado')
    db.close()
  })
  .catch((error) => {
    console.error('❌ Error en el script:', error)
    db.close()
  })
