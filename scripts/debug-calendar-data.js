const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function debugCalendarData() {
  try {
    console.log('🔍 Verificando datos del calendario...')

    // Obtener estudiantes
    const studentsResponse = await fetch(`${API_BASE}/students`)
    if (studentsResponse.ok) {
      const students = await studentsResponse.json()
      console.log(`\n📚 Estudiantes encontrados: ${students.length}`)
      students.forEach(student => {
        console.log(`- ${student.first_name} ${student.last_name} (ID: ${student.id})`)
        if (student.fixed_schedule) {
          try {
            const schedule = JSON.parse(student.fixed_schedule)
            console.log(`  Horario fijo:`, schedule)
          } catch (e) {
            console.log(`  Horario fijo (raw):`, student.fixed_schedule)
          }
        }
      })
    }

    // Obtener clases
    const classesResponse = await fetch(`${API_BASE}/classes`)
    if (classesResponse.ok) {
      const classes = await classesResponse.json()
      console.log(`\n📅 Clases encontradas: ${classes.length}`)
      classes.forEach(cls => {
        console.log(`- ${cls.student_name} - ${cls.start_time}-${cls.end_time} (Día ${cls.day_of_week})`)
      })
    }

    // Obtener cursos
    const coursesResponse = await fetch(`${API_BASE}/courses`)
    if (coursesResponse.ok) {
      const courses = await coursesResponse.json()
      console.log(`\n🎓 Cursos encontrados: ${courses.length}`)
      courses.forEach(course => {
        console.log(`- ${course.name} (ID: ${course.id})`)
      })
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

debugCalendarData()
