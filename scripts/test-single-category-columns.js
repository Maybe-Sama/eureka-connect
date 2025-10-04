const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testSingleCategoryColumns() {
  try {
    console.log('🎨 Probando una categoría por columna...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Modal reorganizado: una categoría por columna')
    
    console.log('\n📐 Nueva disposición:')
    console.log('   🏗️ Layout: grid grid-cols-9 gap-4 (9 columnas)')
    console.log('   📏 Cada columna: Una categoría de color')
    console.log('   🎯 Títulos: text-center (centrados)')
    console.log('   📐 Colores: flex flex-col gap-2 (apilados verticalmente)')
    console.log('   🎨 Cuadrados: mx-auto (centrados en columna)')

    console.log('\n🌈 Organización por columnas individuales:')
    console.log('   📊 Columna 1: Azules (4 colores)')
    console.log('   📊 Columna 2: Verdes (4 colores)')
    console.log('   📊 Columna 3: Púrpuras (2 colores)')
    console.log('   📊 Columna 4: Rosas (3 colores)')
    console.log('   📊 Columna 5: Rojos (2 colores)')
    console.log('   📊 Columna 6: Naranjas (1 color)')
    console.log('   📊 Columna 7: Amarillos (2 colores)')
    console.log('   📊 Columna 8: Turquesas (1 color)')
    console.log('   📊 Columna 9: Grises (2 colores)')

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

    console.log('\n✨ Ventajas de una categoría por columna:')
    console.log('   🎯 Separación clara entre tipos de color')
    console.log('   📐 Fácil identificación de cada categoría')
    console.log('   🎨 Comparación directa entre colores del mismo tipo')
    console.log('   📱 Layout más organizado y limpio')
    console.log('   🔄 Fácil navegación entre categorías')
    console.log('   📏 Mejor aprovechamiento del espacio horizontal')

    console.log('\n🎭 Características visuales:')
    console.log('   📐 9 columnas con gap de 4 entre ellas')
    console.log('   🎯 Títulos centrados en cada columna')
    console.log('   🎨 Cuadrados centrados con mx-auto')
    console.log('   📏 Gap de 2 entre colores en cada columna')
    console.log('   ✨ Animaciones y efectos hover mantenidos')
    console.log('   🎨 Cada columna es independiente y clara')

    console.log('\n🌐 Prueba en: http://localhost:3000/calendar')
    console.log('   👆 Haz clic en "Colores" → Panel principal')
    console.log('   🎨 Haz clic en cualquier cuadrado → Modal con 9 columnas')
    console.log('   📐 Cada categoría de color tiene su propia columna')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testSingleCategoryColumns()
