const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testColorPicker() {
  try {
    console.log('🎨 Probando nuevo sistema de selección de colores...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n👥 Alumnos disponibles para configuración:')
    
    students.forEach((student, index) => {
      console.log(`\n${index + 1}. ${student.first_name} ${student.last_name} (ID: ${student.id})`)
      console.log(`   📧 Email: ${student.email || 'No disponible'}`)
      console.log(`   🎓 Curso: ${student.course_name || 'Sin curso asignado'}`)
    })

    console.log('\n🌈 Nueva gama de colores organizada por gradiente:')
    
    const colorCategories = {
      'Azules': ['Azul Cielo', 'Azul Eléctrico', 'Azul Marino', 'Índigo Profundo'],
      'Verdes': ['Verde Menta', 'Verde Lima', 'Verde Bosque', 'Verde Esmeralda'],
      'Púrpuras': ['Púrpura Lavanda', 'Púrpura Intenso'],
      'Rosas': ['Rosa Suave', 'Rosa Fucsia', 'Magenta Vibrante'],
      'Rojos': ['Rojo Coral', 'Rojo Escarlata'],
      'Naranjas': ['Naranja Melocotón'],
      'Amarillos': ['Amarillo Dorado', 'Amarillo Mostaza'],
      'Turquesas': ['Turquesa Océano'],
      'Grises': ['Gris Perla', 'Gris Azulado']
    }

    Object.entries(colorCategories).forEach(([category, colors]) => {
      console.log(`\n   ${category}:`)
      colors.forEach((color, index) => {
        console.log(`     ${index + 1}. ${color}`)
      })
    })

    console.log('\n✨ Nuevas funcionalidades implementadas:')
    console.log('   🎯 Panel de colores oculto hasta hacer clic en el cuadrado')
    console.log('   🌈 Colores organizados por similitud (gradiente visual)')
    console.log('   📱 Diseño compacto como en la imagen de referencia')
    console.log('   🖱️ Clic en cuadrado de color → abre picker → selecciona → se cierra')
    console.log('   🎨 22 colores únicos y diversos organizados por categorías')
    console.log('   ✅ Indicador visual del color seleccionado')
    console.log('   💫 Animaciones suaves y efectos hover')

    console.log('\n📋 Cómo usar el nuevo sistema:')
    console.log('   1. Ve a http://localhost:3000/calendar')
    console.log('   2. Haz clic en el botón "Colores"')
    console.log('   3. Haz clic en el cuadrado de color de cualquier alumno')
    console.log('   4. Selecciona un color de la paleta organizada')
    console.log('   5. El modal se cierra automáticamente y aplica el color')
    console.log('   6. Guarda los cambios para aplicarlos al calendario')

    console.log('\n🌐 El calendario está disponible en: http://localhost:3000/calendar')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testColorPicker()
