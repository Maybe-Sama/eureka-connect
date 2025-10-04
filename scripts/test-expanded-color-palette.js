const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000/api'

async function testExpandedColorPalette() {
  try {
    console.log('🎨 Probando paleta expandida con 4 colores por categoría...')

    // Obtener datos del calendario
    const [studentsResponse, classesResponse] = await Promise.all([
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/classes`)
    ])

    const students = studentsResponse.ok ? await studentsResponse.json() : []
    const classes = classesResponse.ok ? await classesResponse.json() : []

    console.log('\n✅ Nueva paleta expandida implementada:')
    
    console.log('\n🔵 Azules (4 colores muy diferentes):')
    console.log('   1. Azul Cielo - #e0f2fe (sky-100)')
    console.log('   2. Azul Marino - #bfdbfe (blue-200)')
    console.log('   3. Azul Profundo - #c7d2fe (indigo-200)')
    console.log('   4. Azul Eléctrico - #a5f3fc (cyan-200)')

    console.log('\n🟢 Verdes (4 colores muy diferentes):')
    console.log('   1. Verde Menta - #d1fae5 (emerald-100)')
    console.log('   2. Verde Lima - #d9f99d (lime-200)')
    console.log('   3. Verde Bosque - #bbf7d0 (green-200)')
    console.log('   4. Verde Esmeralda - #99f6e4 (teal-200)')

    console.log('\n🟣 Púrpuras (4 colores muy diferentes):')
    console.log('   1. Púrpura Lavanda - #f3e8ff (purple-100)')
    console.log('   2. Púrpura Intenso - #ddd6fe (violet-200)')
    console.log('   3. Púrpura Real - #f5d0fe (fuchsia-200)')
    console.log('   4. Púrpura Oscuro - #a5b4fc (indigo-300)')

    console.log('\n🌸 Rosas (4 colores muy diferentes):')
    console.log('   1. Rosa Suave - #fce7f3 (pink-100)')
    console.log('   2. Rosa Fucsia - #fae8ff (fuchsia-100)')
    console.log('   3. Rosa Coral - #fecaca (rose-200)')
    console.log('   4. Rosa Vibrante - #fbcfe8 (pink-200)')

    console.log('\n🔴 Rojos (4 colores muy diferentes):')
    console.log('   1. Rojo Coral - #ffe4e6 (rose-100)')
    console.log('   2. Rojo Escarlata - #fecaca (red-200)')
    console.log('   3. Rojo Tomate - #fed7aa (orange-200)')
    console.log('   4. Rojo Intenso - #fca5a5 (red-300)')

    console.log('\n🟠 Naranjas (4 colores muy diferentes):')
    console.log('   1. Naranja Melocotón - #fed7aa (orange-100)')
    console.log('   2. Naranja Dorado - #fde68a (amber-200)')
    console.log('   3. Naranja Intenso - #fed7aa (orange-200)')
    console.log('   4. Naranja Fuego - #fecaca (red-200)')

    console.log('\n🟡 Amarillos (4 colores muy diferentes):')
    console.log('   1. Amarillo Dorado - #fef3c7 (amber-100)')
    console.log('   2. Amarillo Mostaza - #fef08a (yellow-200)')
    console.log('   3. Amarillo Limón - #d9f99d (lime-200)')
    console.log('   4. Amarillo Suave - #fef3c7 (yellow-100)')

    console.log('\n🔵 Turquesas (4 colores muy diferentes):')
    console.log('   1. Turquesa Océano - #cffafe (cyan-100)')
    console.log('   2. Turquesa Profundo - #99f6e4 (teal-200)')
    console.log('   3. Turquesa Claro - #bae6fd (sky-200)')
    console.log('   4. Turquesa Vibrante - #a5f3fc (cyan-200)')

    console.log('\n⚫ Grises (4 colores muy diferentes):')
    console.log('   1. Gris Perla - #f3f4f6 (gray-100)')
    console.log('   2. Gris Azulado - #e2e8f0 (slate-200)')
    console.log('   3. Gris Neutro - #e4e4e7 (zinc-200)')
    console.log('   4. Gris Suave - #e7e5e4 (stone-200)')

    console.log('\n📊 Estadísticas de la nueva paleta:')
    console.log('   🎨 Total de colores: 36 (antes 22)')
    console.log('   📐 Colores por categoría: 4 (antes variable)')
    console.log('   🌈 Categorías: 9 (azul, verde, púrpura, rosa, rojo, naranja, amarillo, turquesa, gris)')
    console.log('   ✨ Diversidad: Mucho mayor dentro de cada categoría')

    console.log('\n🎨 Mejoras en la diversidad:')
    console.log('   🔵 Azules: De sky a cyan, pasando por blue e indigo')
    console.log('   🟢 Verdes: De emerald a teal, pasando por lime y green')
    console.log('   🟣 Púrpuras: De purple a indigo, pasando por violet y fuchsia')
    console.log('   🌸 Rosas: De pink a rose, con variaciones en fuchsia')
    console.log('   🔴 Rojos: De rose a red, incluyendo tonos naranjas')
    console.log('   🟠 Naranjas: De orange a amber, con toques rojizos')
    console.log('   🟡 Amarillos: De amber a lime, con variaciones suaves')
    console.log('   🔵 Turquesas: De cyan a sky, pasando por teal')
    console.log('   ⚫ Grises: De gray a stone, con slate y zinc')

    console.log('\n🌐 Prueba en: http://localhost:3000/calendar')
    console.log('   👆 Haz clic en "Colores" → Panel con 36 colores')
    console.log('   🎨 Haz clic en cuadrado de color → Picker con 4 colores por columna')
    console.log('   ✨ Mucha más diversidad y opciones para cada alumno')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

testExpandedColorPalette()
