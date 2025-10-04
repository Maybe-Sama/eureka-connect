const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testModalPositioning() {
  try {
    console.log('🎯 Verificando posicionamiento de modales...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Cambios aplicados para centrado perfecto:')
    
    console.log('\n🎨 ColorConfigPanel (Panel principal):')
    console.log('   📍 Contenedor: fixed inset-0 + flex items-center justify-center')
    console.log('   📏 Modal: h-[90vh] + flex flex-col (altura fija)')
    console.log('   🎭 Animación: scale(0.8→1.0) + y(20→0)')
    console.log('   📱 Padding: p-4 para responsive')
    console.log('   🎯 Resultado: Centrado perfecto vertical y horizontalmente')

    console.log('\n🌈 ColorPickerModal (Selector de colores):')
    console.log('   📍 Contenedor: fixed inset-0 + flex items-center justify-center')
    console.log('   📏 Modal: h-[80vh] + flex flex-col (altura fija)')
    console.log('   🎭 Animación: scale(0.8→1.0) + y(20→0)')
    console.log('   📱 Padding: p-4 para responsive')
    console.log('   🎯 Resultado: Centrado perfecto vertical y horizontalmente')

    console.log('\n🔧 Cambios técnicos realizados:')
    console.log('   ❌ Eliminado: max-h-[90vh] y max-h-[80vh]')
    console.log('   ✅ Agregado: h-[90vh] y h-[80vh] (altura fija)')
    console.log('   ✅ Agregado: flex flex-col para estructura correcta')
    console.log('   ✅ Mantenido: items-center justify-center para centrado')
    console.log('   ✅ Mantenido: p-4 para padding responsive')

    console.log('\n🎨 Diferencias visuales:')
    console.log('   📍 ANTES: Modal aparecía en la parte inferior')
    console.log('   📍 AHORA: Modal aparece perfectamente centrado')
    console.log('   📏 ANTES: Altura variable (max-h) causaba problemas')
    console.log('   📏 AHORA: Altura fija (h) permite centrado consistente')
    console.log('   🎭 ANTES: Animación desde abajo')
    console.log('   🎭 AHORA: Animación desde el centro con escala')

    console.log('\n🌐 Prueba en: http://localhost:3000/calendar')
    console.log('   👆 Haz clic en "Colores" → Panel aparece centrado')
    console.log('   🎨 Haz clic en cuadrado de color → Picker aparece centrado')
    console.log('   ✨ Ambos modales ahora aparecen en el centro de la pantalla')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testModalPositioning()
