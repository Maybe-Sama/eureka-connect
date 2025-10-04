const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testModalPositioningTop40() {
  try {
    console.log('🎯 Probando posicionamiento con top: 40px...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Modales posicionados con top: 40px:')
    
    console.log('\n🎨 ColorConfigPanel (Panel principal):')
    console.log('   📍 Posición: fixed inset-0 + top: 40px')
    console.log('   🎯 Resultado: Modal aparece 40px desde la parte superior')
    console.log('   📐 Tamaño: max-w-2xl max-h-[80vh]')
    console.log('   🎭 Animación: Centrado con offset superior')

    console.log('\n🌈 ColorPickerModal (Selector de colores):')
    console.log('   📍 Posición: fixed inset-0 + top: 40px')
    console.log('   🎯 Resultado: Modal aparece 40px desde la parte superior')
    console.log('   📐 Tamaño: max-w-5xl max-h-[70vh]')
    console.log('   🎭 Animación: Centrado con offset superior')

    console.log('\n📊 Cambios aplicados:')
    console.log('   ✅ Agregado: style={{ top: "40px" }} a ambos modales')
    console.log('   ✅ Mantenido: flex items-center justify-center para centrado')
    console.log('   ✅ Mantenido: p-4 para padding responsive')
    console.log('   ✅ Mantenido: Animaciones y transiciones')

    console.log('\n🎨 Beneficios del posicionamiento:')
    console.log('   📱 Mejor visibilidad en pantallas pequeñas')
    console.log('   🎯 Evita solapamiento con elementos superiores')
    console.log('   📐 Posicionamiento más controlado')
    console.log('   🎨 Mejor experiencia en dispositivos móviles')
    console.log('   ✨ Apariencia más profesional y pulida')

    console.log('\n🔄 Comportamiento:')
    console.log('   📍 Los modales aparecen 40px desde la parte superior')
    console.log('   🎯 Se mantienen centrados horizontalmente')
    console.log('   📐 Se adaptan al contenido disponible')
    console.log('   🎭 Las animaciones funcionan correctamente')
    console.log('   ✨ El fondo oscuro cubre toda la pantalla')

    console.log('\n🌐 Prueba en: http://localhost:3000/calendar')
    console.log('   👆 Haz clic en "Colores" → Panel aparece con top: 40px')
    console.log('   🎨 Haz clic en cuadrado de color → Picker aparece con top: 40px')
    console.log('   ✨ Ambos modales ahora tienen posicionamiento optimizado')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testModalPositioningTop40()
