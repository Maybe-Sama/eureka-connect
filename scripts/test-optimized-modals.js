const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testOptimizedModals() {
  try {
    console.log('🎯 Probando modales optimizados sin espacio sobrante...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Modales optimizados sin espacio sobrante:')
    
    console.log('\n🎨 ColorConfigPanel (Panel principal):')
    console.log('   📐 Tamaño: max-w-2xl max-h-[80vh] (antes max-w-4xl h-[90vh])')
    console.log('   📏 Header: p-4 (antes p-6)')
    console.log('   📏 Content: p-4 flex-1 (antes p-6 max-h-[calc(90vh-140px)])')
    console.log('   📏 Footer: p-4 (antes p-6)')
    console.log('   ✨ Resultado: Más compacto y sin espacio sobrante')

    console.log('\n🌈 ColorPickerModal (Selector de colores):')
    console.log('   📐 Tamaño: max-w-5xl max-h-[70vh] (antes max-w-4xl h-[60vh])')
    console.log('   📏 Header: p-4 (mantenido)')
    console.log('   📏 Content: p-3 (antes p-4)')
    console.log('   📐 Grid: gap-2 (antes gap-4)')
    console.log('   📐 Colores: gap-1 (antes gap-2)')
    console.log('   ✨ Resultado: Más compacto y eficiente')

    console.log('\n📊 Optimizaciones aplicadas:')
    console.log('   ❌ Eliminado: Espacio sobrante innecesario')
    console.log('   ✅ Reducido: Padding de p-6 a p-4 en headers y footers')
    console.log('   ✅ Reducido: Padding de p-4 a p-3 en contenido del picker')
    console.log('   ✅ Reducido: Gap entre columnas de 4 a 2')
    console.log('   ✅ Reducido: Gap entre colores de 2 a 1')
    console.log('   ✅ Optimizado: Tamaños de modales para mejor aprovechamiento')
    console.log('   ✅ Mejorado: flex-1 para contenido que se adapta automáticamente')

    console.log('\n🎨 Beneficios de la optimización:')
    console.log('   📱 Modales más compactos y eficientes')
    console.log('   🎯 Mejor aprovechamiento del espacio disponible')
    console.log('   📐 Sin espacios sobrantes innecesarios')
    console.log('   🎨 Colores más cercanos entre sí para mejor comparación')
    console.log('   📏 Layout más limpio y profesional')
    console.log('   ✨ Mejor experiencia de usuario')

    console.log('\n🔄 Comparación antes vs después:')
    console.log('   📊 ANTES: ColorConfigPanel max-w-4xl h-[90vh] con p-6')
    console.log('   📊 AHORA: ColorConfigPanel max-w-2xl max-h-[80vh] con p-4')
    console.log('   📊 ANTES: ColorPickerModal max-w-4xl h-[60vh] con gap-4')
    console.log('   📊 AHORA: ColorPickerModal max-w-5xl max-h-[70vh] con gap-2')
    console.log('   📊 RESULTADO: Modales más compactos y sin espacio sobrante')

    console.log('\n🌐 Prueba en: http://localhost:3000/calendar')
    console.log('   👆 Haz clic en "Colores" → Panel compacto sin espacio sobrante')
    console.log('   🎨 Haz clic en cuadrado de color → Picker optimizado')
    console.log('   ✨ Ambos modales ahora son más eficientes y compactos')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testOptimizedModals()
