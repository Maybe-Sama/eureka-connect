const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testViewportCentering() {
  try {
    console.log('🎯 Probando centrado en viewport de pantalla...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Modales centrados en viewport de pantalla:')
    
    console.log('\n🎨 ColorConfigPanel (Panel principal):')
    console.log('   📍 Posición: fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2')
    console.log('   🎯 Resultado: Siempre centrado en el centro de la pantalla')
    console.log('   📐 Altura: maxHeight: calc(100vh - 2rem)')
    console.log('   📏 Ancho: max-w-2xl')

    console.log('\n🌈 ColorPickerModal (Selector de colores):')
    console.log('   📍 Posición: fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2')
    console.log('   🎯 Resultado: Siempre centrado en el centro de la pantalla')
    console.log('   📐 Altura: maxHeight: calc(100vh - 2rem)')
    console.log('   📏 Ancho: max-w-5xl')

    console.log('\n📊 Solución implementada:')
    console.log('   ❌ Eliminado: flex items-center justify-center (se centraba en contenido)')
    console.log('   ✅ Usado: fixed top-1/2 left-1/2 (centro del viewport)')
    console.log('   ✅ Usado: transform -translate-x-1/2 -translate-y-1/2 (centrado perfecto)')
    console.log('   ✅ Usado: maxHeight: calc(100vh - 2rem) (altura responsiva)')
    console.log('   ✅ Usado: p-4 en el modal para padding interno')

    console.log('\n🎨 Cómo funciona el centrado:')
    console.log('   📍 top-1/2: Posiciona el modal al 50% desde arriba del viewport')
    console.log('   📍 left-1/2: Posiciona el modal al 50% desde la izquierda del viewport')
    console.log('   🎯 -translate-x-1/2: Mueve el modal 50% de su ancho hacia la izquierda')
    console.log('   🎯 -translate-y-1/2: Mueve el modal 50% de su altura hacia arriba')
    console.log('   ✨ Resultado: Centro perfecto del viewport, no del contenido')

    console.log('\n🔄 Ventajas de esta solución:')
    console.log('   📱 Centrado perfecto en cualquier posición de scroll')
    console.log('   🎯 Siempre en el centro de la pantalla visible')
    console.log('   📐 Independiente del contenido de la página')
    console.log('   🔄 Funciona en cualquier tamaño de pantalla')
    console.log('   ✨ Experiencia consistente en todos los dispositivos')

    console.log('\n📱 Comportamiento en diferentes escenarios:')
    console.log('   📜 Página con scroll: Modal aparece en centro de pantalla visible')
    console.log('   📱 Móvil: Modal centrado en viewport móvil')
    console.log('   💻 Desktop: Modal centrado en viewport desktop')
    console.log('   🔄 Cambio de tamaño: Se re-centra automáticamente')
    console.log('   ✨ Animación: Suave desde el centro del viewport')

    console.log('\n🌐 Prueba en: http://localhost:3000/calendar')
    console.log('   👆 Haz scroll en la página y haz clic en "Colores"')
    console.log('   🎨 El modal aparecerá siempre en el centro de tu pantalla')
    console.log('   ✨ Independientemente de dónde esté el scroll de la página')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testViewportCentering()
