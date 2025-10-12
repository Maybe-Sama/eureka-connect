/**
 * DEBUG: Verificar relaciones de base de datos y buscar €12/h
 * 
 * Este script verifica las relaciones y busca cualquier precio €12
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

async function debugDatabaseRelationships() {
  console.log('🔍 Verificando relaciones de base de datos y buscando €12/h...\n')
  
  // 1. Verificar todos los precios únicos en cursos
  console.log('1️⃣ Verificando precios únicos en cursos...')
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, name, price, shared_class_price')
    .order('price')
  
  if (coursesError) {
    console.error('❌ Error al obtener cursos:', coursesError)
    return
  }
  
  if (courses && courses.length > 0) {
    const uniquePrices = [...new Set(courses.map(c => c.price))].sort()
    console.log(`   Precios únicos encontrados: ${uniquePrices.map(p => `€${p}`).join(', ')}`)
    
    if (uniquePrices.includes(12)) {
      console.log('   ✅ Se encontró al menos un curso con precio €12')
      const coursesWith12 = courses.filter(c => c.price === 12)
      coursesWith12.forEach(course => {
        console.log(`     - ${course.name} (ID: ${course.id})`)
      })
    } else {
      console.log('   ℹ️  No se encontraron cursos con precio €12')
    }
  }
  
  // 2. Verificar estudiantes con datos de curso faltantes
  console.log('\n2️⃣ Verificando estudiantes con datos de curso faltantes...')
  const { data: studentsWithMissingCourse, error: studentsError } = await supabase
    .from('students')
    .select('id, first_name, last_name, course_id, has_shared_pricing')
    .not('course_id', 'is', null)
    .limit(10)
  
  if (studentsError) {
    console.error('❌ Error al obtener estudiantes:', studentsError)
    return
  }
  
  if (studentsWithMissingCourse && studentsWithMissingCourse.length > 0) {
    console.log(`   Encontrados ${studentsWithMissingCourse.length} estudiantes con course_id:`)
    for (const student of studentsWithMissingCourse) {
      console.log(`   - ${student.first_name} ${student.last_name} (course_id: ${student.course_id}, shared: ${student.has_shared_pricing})`)
      
      // Verificar si el curso existe
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('id, name, price, shared_class_price')
        .eq('id', student.course_id)
        .single()
      
      if (courseError) {
        console.log(`     ❌ Error al obtener curso ${student.course_id}: ${courseError.message}`)
      } else if (course) {
        console.log(`     ✅ Curso: ${course.name} - €${course.price} (compartido: €${course.shared_class_price})`)
      } else {
        console.log(`     ⚠️  Curso ${student.course_id} no encontrado`)
      }
    }
  }
  
  // 3. Buscar en clases existentes por precio €12
  console.log('\n3️⃣ Buscando clases con precio €12...')
  const { data: classesWith12, error: classesError } = await supabase
    .from('classes')
    .select('id, student_id, course_id, price, duration, date')
    .eq('price', 12)
    .limit(10)
  
  if (classesError) {
    console.error('❌ Error al buscar clases:', classesError)
  } else if (classesWith12 && classesWith12.length > 0) {
    console.log(`   Encontradas ${classesWith12.length} clases con precio €12:`)
    for (const cls of classesWith12) {
      console.log(`   - Clase ${cls.id}: ${cls.date} - €${cls.price} (${cls.duration}min) - Estudiante: ${cls.student_id}`)
    }
  } else {
    console.log('   ℹ️  No se encontraron clases con precio €12')
  }
  
  // 4. Buscar clases con precio por hora €12 (calculado)
  console.log('\n4️⃣ Buscando clases con precio por hora €12 (calculado)...')
  const { data: allClasses, error: allClassesError } = await supabase
    .from('classes')
    .select('id, student_id, course_id, price, duration, date')
    .limit(50)
  
  if (allClassesError) {
    console.error('❌ Error al obtener clases:', allClassesError)
  } else if (allClasses && allClasses.length > 0) {
    const classesWith12PerHour = allClasses.filter(cls => {
      const pricePerHour = (cls.price / (cls.duration / 60)).toFixed(2)
      return Math.abs(parseFloat(pricePerHour) - 12) <= 0.01
    })
    
    if (classesWith12PerHour.length > 0) {
      console.log(`   Encontradas ${classesWith12PerHour.length} clases con €12/hora:`)
      for (const cls of classesWith12PerHour) {
        const pricePerHour = (cls.price / (cls.duration / 60)).toFixed(2)
        console.log(`   - Clase ${cls.id}: ${cls.date} - €${cls.price} (${cls.duration}min) = €${pricePerHour}/h - Estudiante: ${cls.student_id}`)
      }
    } else {
      console.log('   ℹ️  No se encontraron clases con €12/hora')
    }
  } else {
    console.log('   ℹ️  No hay clases en la base de datos')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ Verificación completada')
}

// Ejecutar
debugDatabaseRelationships()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
