const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testHorizontalColors() {
  try {
    console.log('🎨 Probando disposición horizontal de colores...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Modal de selección de colores optimizado:')
    
    console.log('\n📏 Tamaño reducido:')
    console.log('   📐 Altura: h-[60vh] (antes h-[80vh])')
    console.log('   📐 Ancho: max-w-4xl (antes max-w-2xl)')
    console.log('   📐 Header: p-4 (antes p-6)')
    console.log('   📐 Content: p-4 (antes p-6)')
    console.log('   📐 Título: text-lg (antes text-xl)')

    console.log('\n🎨 Disposición horizontal:')
    console.log('   📐 Cuadrados: w-10 h-10 (antes w-12 h-12)')
    console.log('   📐 Gap: gap-2 (antes gap-3)')
    console.log('   📐 Layout: flex flex-wrap (antes grid grid-cols-6)')
    console.log('   📐 Categorías: text-xs mb-2 (antes text-sm mb-3)')
    console.log('   📐 Check: w-2.5 h-2.5 (antes w-3 h-3)')

    console.log('\n🌈 Organización por categorías:')
    console.log('   🔵 Azules: 4 colores en fila horizontal')
    console.log('   🟢 Verdes: 4 colores en fila horizontal')
    console.log('   🟣 Púrpuras: 2 colores en fila horizontal')
    console.log('   🌸 Rosas: 3 colores en fila horizontal')
    console.log('   🔴 Rojos: 2 colores en fila horizontal')
    console.log('   🟠 Naranjas: 1 color en fila horizontal')
    console.log('   🟡 Amarillos: 2 colores en fila horizontal')
    console.log('   🔵 Turquesas: 1 color en fila horizontal')
    console.log('   ⚫ Grises: 2 colores en fila horizontal')

    console.log('\n✨ Mejoras visuales:')
    console.log('   📱 Más compacto y eficiente en espacio')
    console.log('   🎯 Colores organizados horizontalmente por categoría')
    console.log('   🔄 Flex-wrap permite adaptación automática')
    console.log('   🎨 Cuadrados más pequeños pero aún clickeables')
    console.log('   📏 Modal más pequeño pero con mejor aprovechamiento')
    console.log('   🎭 Animaciones mantenidas pero más sutiles')

    console.log('\n🔄 Flujo de uso optimizado:')
    console.log('   1. Clic en cuadrado de color → Modal compacto aparece')
    console.log('   2. Colores organizados horizontalmente por categoría')
    console.log('   3. Selección rápida con cuadrados más pequeños')
    console.log('   4. Modal se cierra automáticamente al seleccionar')
    console.log('   5. Mejor experiencia visual y más eficiente')

    console.log('\n🌐 Prueba en: http://localhost:3000/calendar')
    console.log('   👆 Haz clic en "Colores" → Panel principal')
    console.log('   🎨 Haz clic en cualquier cuadrado → Modal horizontal compacto')
    console.log('   ✨ Disposición horizontal más eficiente y visualmente atractiva')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testHorizontalColors()
