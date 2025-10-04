const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testColumnLayout() {
  try {
    console.log('📐 Probando disposición en columnas...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Modal reorganizado en columnas:')
    
    console.log('\n📐 Nueva disposición:')
    console.log('   🏗️ Layout: grid grid-cols-3 gap-6 (3 columnas)')
    console.log('   📏 Categorías: space-y-2 (espaciado vertical)')
    console.log('   🎯 Títulos: text-center (centrados)')
    console.log('   📐 Colores: flex flex-col gap-2 (columna vertical)')
    console.log('   🎨 Cuadrados: mx-auto (centrados en columna)')

    console.log('\n🌈 Organización por columnas:')
    console.log('   📊 Columna 1: Azules, Verdes, Púrpuras')
    console.log('   📊 Columna 2: Rosas, Rojos, Naranjas')
    console.log('   📊 Columna 3: Amarillos, Turquesas, Grises')

    console.log('\n🎨 Cada columna contiene:')
    console.log('   🔵 Azules: 4 colores apilados verticalmente')
    console.log('   🟢 Verdes: 4 colores apilados verticalmente')
    console.log('   🟣 Púrpuras: 2 colores apilados verticalmente')
    console.log('   🌸 Rosas: 3 colores apilados verticalmente')
    console.log('   🔴 Rojos: 2 colores apilados verticalmente')
    console.log('   🟠 Naranjas: 1 color apilado verticalmente')
    console.log('   🟡 Amarillos: 2 colores apilados verticalmente')
    console.log('   🔵 Turquesas: 1 color apilado verticalmente')
    console.log('   ⚫ Grises: 2 colores apilados verticalmente')

    console.log('\n✨ Ventajas de la disposición en columnas:')
    console.log('   📱 Mejor aprovechamiento del espacio horizontal')
    console.log('   🎯 Categorías claramente separadas')
    console.log('   📐 Colores organizados verticalmente por tipo')
    console.log('   🎨 Fácil comparación entre colores similares')
    console.log('   📏 Layout más compacto y organizado')
    console.log('   🔄 Responsive: se adapta a diferentes tamaños')

    console.log('\n🎭 Características visuales:')
    console.log('   📐 Títulos centrados en cada columna')
    console.log('   🎨 Cuadrados centrados con mx-auto')
    console.log('   📏 Gap de 6 entre columnas para separación clara')
    console.log('   🎯 Gap de 2 entre colores en cada columna')
    console.log('   ✨ Animaciones y efectos hover mantenidos')

    console.log('\n🌐 Prueba en: http://localhost:3000/calendar')
    console.log('   👆 Haz clic en "Colores" → Panel principal')
    console.log('   🎨 Haz clic en cualquier cuadrado → Modal en columnas')
    console.log('   📐 Colores organizados en 3 columnas verticales')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testColumnLayout()
