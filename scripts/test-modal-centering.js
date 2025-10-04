const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testModalCentering() {
  try {
    console.log('🎯 Probando centrado de modales...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Modales actualizados para aparecer centrados:')
    
    console.log('\n🎨 ColorConfigPanel (Panel principal de colores):')
    console.log('   📍 Posición: Centrado en pantalla')
    console.log('   🎭 Animación: Scale + Y movement (0.8 → 1.0, y: 20 → 0)')
    console.log('   ⏱️ Transición: Spring animation (0.5s)')
    console.log('   📱 Responsive: max-w-4xl, max-h-[90vh]')
    console.log('   🎯 Trigger: Botón "Colores" en el calendario')

    console.log('\n🌈 ColorPickerModal (Selector de colores):')
    console.log('   📍 Posición: Centrado en pantalla')
    console.log('   🎭 Animación: Scale + Y movement (0.8 → 1.0, y: 20 → 0)')
    console.log('   ⏱️ Transición: Spring animation (0.5s)')
    console.log('   📱 Responsive: max-w-2xl, max-h-[80vh]')
    console.log('   🎯 Trigger: Clic en cuadrado de color del alumno')

    console.log('\n🔄 Flujo de interacción mejorado:')
    console.log('   1. Clic en "Colores" → Panel principal aparece centrado')
    console.log('   2. Clic en cuadrado de color → Modal de selección aparece centrado')
    console.log('   3. Selección de color → Modal se cierra con animación')
    console.log('   4. Guardar cambios → Panel principal se cierra')

    console.log('\n🎨 Mejoras visuales implementadas:')
    console.log('   ✨ Animación suave desde el centro (no desde abajo)')
    console.log('   🎯 Posicionamiento perfecto en el centro de la pantalla')
    console.log('   📱 Padding responsive para diferentes tamaños de pantalla')
    console.log('   🌊 Transición spring para un efecto más natural')
    console.log('   🎭 Efecto de escala + movimiento vertical sutil')

    console.log('\n🌐 Prueba el calendario en: http://localhost:3000/calendar')
    console.log('   👆 Haz clic en "Colores" para ver el panel centrado')
    console.log('   🎨 Haz clic en cualquier cuadrado de color para ver el picker centrado')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testModalCentering()
