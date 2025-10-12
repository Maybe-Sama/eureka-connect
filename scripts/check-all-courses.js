/**
 * CHECK: Verificar todos los cursos y sus precios
 * 
 * Este script lista todos los cursos para verificar precios
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno no encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAllCourses() {
  console.log('🔍 Verificando todos los cursos y sus precios...\n')
  
  // Obtener todos los cursos
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, name, price, shared_class_price, color, is_active')
    .order('name')
  
  if (coursesError) {
    console.error('❌ Error al obtener cursos:', coursesError)
    return
  }
  
  if (!courses || courses.length === 0) {
    console.log('ℹ️  No hay cursos en la base de datos')
    return
  }
  
  console.log(`📚 Encontrados ${courses.length} cursos:\n`)
  
  courses.forEach((course, index) => {
    console.log(`${index + 1}. ${course.name}`)
    console.log(`   ID: ${course.id}`)
    console.log(`   Precio normal: €${course.price}`)
    console.log(`   Precio compartido: €${course.shared_class_price || 'No definido'}`)
    console.log(`   Color: ${course.color}`)
    console.log(`   Activo: ${course.is_active ? 'SÍ' : 'NO'}`)
    console.log('')
  })
  
  // Buscar cursos con precio €12
  const coursesWith12 = courses.filter(c => c.price === 12)
  if (coursesWith12.length > 0) {
    console.log('🔍 Cursos con precio €12:')
    coursesWith12.forEach(course => {
      console.log(`   - ${course.name} (ID: ${course.id})`)
    })
  } else {
    console.log('ℹ️  No se encontraron cursos con precio €12')
  }
  
  // Buscar cursos que contengan "bach" y "sociales"
  const bachSocialesCourses = courses.filter(c => 
    c.name.toLowerCase().includes('bach') && 
    c.name.toLowerCase().includes('sociales')
  )
  
  if (bachSocialesCourses.length > 0) {
    console.log('\n🔍 Cursos "bach sociales":')
    bachSocialesCourses.forEach(course => {
      console.log(`   - ${course.name} (ID: ${course.id}) - €${course.price}`)
    })
  }
}

// Ejecutar
checkAllCourses()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
