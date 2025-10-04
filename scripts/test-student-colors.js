const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

// Función para generar un color único para cada alumno (igual que en el componente)
const getStudentColor = (studentId) => {
  const colors = [
    'bg-blue-100 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700',
    'bg-green-100 border-green-300 dark:bg-green-900/20 dark:border-green-700',
    'bg-purple-100 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700',
    'bg-pink-100 border-pink-300 dark:bg-pink-900/20 dark:border-pink-700',
    'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700',
    'bg-indigo-100 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700',
    'bg-red-100 border-red-300 dark:bg-red-900/20 dark:border-red-700',
    'bg-orange-100 border-orange-300 dark:bg-orange-900/20 dark:border-orange-700',
    'bg-teal-100 border-teal-300 dark:bg-teal-900/20 dark:border-teal-700',
    'bg-cyan-100 border-cyan-300 dark:bg-cyan-900/20 dark:border-cyan-700',
    'bg-emerald-100 border-emerald-300 dark:bg-emerald-900/20 dark:border-emerald-700',
    'bg-violet-100 border-violet-300 dark:bg-violet-900/20 dark:border-violet-700'
  ]
  
  return colors[studentId % colors.length]
}

async function testStudentColors() {
  try {
    console.log('🎨 Probando colores únicos por alumno...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n👥 Alumnos y sus colores asignados:')
    
    // Mostrar cada alumno con su color asignado
    students.forEach((student, index) => {
      const studentId = student.id
      const colorClass = getStudentColor(studentId)
      const colorName = colorClass.split(' ')[0].replace('bg-', '').replace('-100', '')
      
      console.log(`\n${index + 1}. ${student.first_name} ${student.last_name} (ID: ${studentId})`)
      console.log(`   🎨 Color: ${colorName}`)
      console.log(`   📝 Clase CSS: ${colorClass}`)
    })

    console.log('\n📅 Clases y sus colores:')
    
    // Mostrar cada clase con su color
    classes.forEach((cls, index) => {
      const colorClass = getStudentColor(cls.student_id)
      const colorName = colorClass.split(' ')[0].replace('bg-', '').replace('-100', '')
      const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][cls.day_of_week - 1] || 'Desconocido'
      
      console.log(`\n${index + 1}. ${cls.student_name} - ${dayName} ${cls.start_time}-${cls.end_time}`)
      console.log(`   🎨 Color: ${colorName}`)
    })

    // Verificar que no hay colores duplicados
    const uniqueStudentIds = [...new Set(classes.map(cls => cls.student_id))]
    const uniqueColors = [...new Set(uniqueStudentIds.map(id => getStudentColor(id)))]
    
    console.log(`\n📊 Resumen:`)
    console.log(`   - Alumnos únicos con clases: ${uniqueStudentIds.length}`)
    console.log(`   - Colores únicos asignados: ${uniqueColors.length}`)
    
    if (uniqueStudentIds.length === uniqueColors.length) {
      console.log(`   ✅ ¡Perfecto! Cada alumno tiene un color único`)
    } else {
      console.log(`   ⚠️ Hay colores duplicados`)
    }

    console.log('\n🌐 El calendario está disponible en: http://localhost:3000/calendar')
    console.log('📱 Verifica visualmente que cada alumno tenga un color diferente')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testStudentColors()
