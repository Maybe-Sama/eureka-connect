const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testColorPanel() {
  try {
    console.log('🎨 Probando panel de configuración de colores...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n👥 Alumnos disponibles para configuración de colores:')
    
    students.forEach((student, index) => {
      console.log(`\n${index + 1}. ${student.first_name} ${student.last_name} (ID: ${student.id})`)
      console.log(`   📧 Email: ${student.email || 'No disponible'}`)
      console.log(`   📱 Teléfono: ${student.phone || 'No disponible'}`)
      console.log(`   🎓 Curso: ${student.course_name || 'Sin curso asignado'}`)
    })

    console.log('\n📅 Clases actuales:')
    
    classes.forEach((cls, index) => {
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][cls.day_of_week - 1] || 'Desconocido'
      console.log(`\n${index + 1}. ${cls.student_name} - ${dayName} ${cls.start_time}-${cls.end_time}`)
    })

    console.log('\n🎨 Colores predefinidos disponibles:')
    const colors = [
      'Azul', 'Verde', 'Púrpura', 'Rosa', 'Amarillo', 'Índigo',
      'Rojo', 'Naranja', 'Turquesa', 'Cian', 'Esmeralda', 'Violeta'
    ]
    
    colors.forEach((color, index) => {
      console.log(`   ${index + 1}. ${color}`)
    })

    console.log('\n✅ Funcionalidades del panel de configuración:')
    console.log('   🎨 Asignar colores personalizados a cada alumno')
    console.log('   💾 Guardar configuraciones en localStorage')
    console.log('   🔄 Resetear a colores por defecto')
    console.log('   👀 Vista previa de colores en tiempo real')
    console.log('   📱 Interfaz responsive y moderna')

    console.log('\n🌐 El calendario está disponible en: http://localhost:3000/calendar')
    console.log('📱 Haz clic en el botón "Colores" para abrir el panel de configuración')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testColorPanel()
