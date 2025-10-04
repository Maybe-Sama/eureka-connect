const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testNewColors() {
  try {
    console.log('🎨 Probando nueva gama de colores diversa...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n👥 Alumnos y sus nuevos colores asignados:')
    
    // Mostrar cada alumno con su color asignado
    students.forEach((student, index) => {
      const studentId = student.id
      const colorIndex = studentId % 18 // 18 colores disponibles
      const colors = [
        'Azul Cielo', 'Verde Lima', 'Púrpura Intenso', 'Rosa Fucsia', 'Amarillo Dorado', 'Azul Marino',
        'Rojo Coral', 'Naranja Melocotón', 'Turquesa Océano', 'Verde Bosque', 'Índigo Profundo', 'Magenta Vibrante',
        'Azul Eléctrico', 'Verde Menta', 'Púrpura Lavanda', 'Amarillo Mostaza', 'Rojo Escarlata', 'Verde Esmeralda'
      ]
      
      console.log(`\n${index + 1}. ${student.first_name} ${student.last_name} (ID: ${studentId})`)
      console.log(`   🎨 Color: ${colors[colorIndex]}`)
    })

    console.log('\n🌈 Nueva gama de colores diversa:')
    const colors = [
      'Azul Cielo', 'Verde Lima', 'Púrpura Intenso', 'Rosa Fucsia', 'Amarillo Dorado', 'Azul Marino',
      'Rojo Coral', 'Naranja Melocotón', 'Turquesa Océano', 'Verde Bosque', 'Índigo Profundo', 'Magenta Vibrante',
      'Azul Eléctrico', 'Verde Menta', 'Púrpura Lavanda', 'Amarillo Mostaza', 'Rojo Escarlata', 'Verde Esmeralda'
    ]
    
    colors.forEach((color, index) => {
      console.log(`   ${index + 1}. ${color}`)
    })

    console.log('\n✨ Mejoras implementadas:')
    console.log('   🎨 18 colores únicos y diversos (vs 12 anteriores)')
    console.log('   🎯 Tonos más diferenciados y contrastantes')
    console.log('   📱 Nuevo diseño compacto como en la imagen de referencia')
    console.log('   🖱️ Interacción mejorada: clic en tarjeta para cambiar color')
    console.log('   🎪 Paleta de colores más organizada y visual')
    console.log('   💫 Animaciones suaves y efectos hover')

    console.log('\n🌐 El calendario está disponible en: http://localhost:3000/calendar')
    console.log('📱 Haz clic en el botón "Colores" para ver el nuevo diseño')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testNewColors()
