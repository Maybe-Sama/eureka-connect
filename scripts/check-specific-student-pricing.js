/**
 * CHECK: Verificar precios específicos de estudiantes
 * 
 * Este script busca estudiantes específicos y verifica sus precios
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

async function checkSpecificStudentPricing() {
  console.log('🔍 Verificando precios específicos de estudiantes...\n')
  
  // 1. Buscar estudiantes con curso "1ºbach sociales" o similar
  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      first_name,
      last_name,
      course_id,
      has_shared_pricing,
      courses:course_id (
        id,
        name,
        price,
        shared_class_price
      )
    `)
    .ilike('courses.name', '%1º%bach%sociales%')
  
  if (studentsError) {
    console.error('❌ Error al buscar estudiantes:', studentsError)
    return
  }
  
  if (!students || students.length === 0) {
    console.log('ℹ️  No se encontraron estudiantes con curso "1ºbach sociales"')
    
    // Buscar todos los cursos que contengan "bach" o "sociales"
    const { data: allCourses, error: coursesError } = await supabase
      .from('courses')
      .select('id, name, price, shared_class_price')
      .or('name.ilike.%bach%,name.ilike.%sociales%')
    
    if (coursesError) {
      console.error('❌ Error al buscar cursos:', coursesError)
      return
    }
    
    console.log('\n📚 Cursos relacionados encontrados:')
    allCourses?.forEach(course => {
      console.log(`   - ${course.name} (ID: ${course.id}) - Normal: €${course.price}, Compartido: €${course.shared_class_price}`)
    })
    
    if (allCourses && allCourses.length > 0) {
      console.log('\n🔍 Buscando estudiantes con estos cursos...')
      
      const courseIds = allCourses.map(c => c.id)
      const { data: studentsWithCourses, error: studentsWithCoursesError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          course_id,
          has_shared_pricing,
          courses:course_id (
            id,
            name,
            price,
            shared_class_price
          )
        `)
        .in('course_id', courseIds)
      
      if (studentsWithCoursesError) {
        console.error('❌ Error al buscar estudiantes con cursos:', studentsWithCoursesError)
        return
      }
      
      if (studentsWithCourses && studentsWithCourses.length > 0) {
        console.log(`\n👥 Encontrados ${studentsWithCourses.length} estudiantes con cursos relacionados:`)
        studentsWithCourses.forEach(student => {
          console.log(`   - ${student.first_name} ${student.last_name} (${student.courses?.name}) - Precio compartido: ${student.has_shared_pricing ? 'SÍ' : 'NO'}`)
        })
        
        // Verificar clases de estos estudiantes
        for (const student of studentsWithCourses) {
          await checkStudentClasses(student)
        }
      }
    }
    
    return
  }
  
  console.log(`📋 Encontrados ${students.length} estudiante(s) con curso "1ºbach sociales":\n`)
  
  for (const student of students) {
    console.log(`\n👤 ${student.first_name} ${student.last_name}`)
    console.log(`   Curso: ${student.courses?.name}`)
    console.log(`   Precio normal: €${student.courses?.price}`)
    console.log(`   Precio compartido: €${student.courses?.shared_class_price}`)
    console.log(`   Tiene precio compartido: ${student.has_shared_pricing ? 'SÍ' : 'NO'}`)
    
    await checkStudentClasses(student)
  }
}

async function checkStudentClasses(student) {
  // Obtener clases del estudiante
  const { data: classes, error: classesError } = await supabase
    .from('classes')
    .select('id, date, price, duration, status, payment_status')
    .eq('student_id', student.id)
    .order('date', { ascending: false })
    .limit(10) // Solo las últimas 10 clases
  
  if (classesError) {
    console.error(`   ❌ Error al obtener clases:`, classesError)
    return
  }
  
  if (!classes || classes.length === 0) {
    console.log('   ⚠️  No tiene clases generadas')
    return
  }
  
  console.log(`   📚 ${classes.length} clases encontradas:`)
  
  // Calcular precio esperado
  const expectedPricePerHour = student.has_shared_pricing && student.courses?.shared_class_price
    ? student.courses.shared_class_price
    : student.courses?.price
  
  console.log(`   💰 Precio esperado por hora: €${expectedPricePerHour}`)
  
  // Verificar cada clase
  let incorrectPricingCount = 0
  classes.forEach((cls, index) => {
    const actualPricePerHour = (cls.price / (cls.duration / 60)).toFixed(2)
    const isCorrect = Math.abs(parseFloat(actualPricePerHour) - expectedPricePerHour) <= 0.01
    
    if (!isCorrect) {
      incorrectPricingCount++
    }
    
    console.log(`   ${index + 1}. ${cls.date} - €${cls.price} (${cls.duration}min) = €${actualPricePerHour}/h ${isCorrect ? '✅' : '❌'} [${cls.status}]`)
  })
  
  if (incorrectPricingCount > 0) {
    console.log(`   ⚠️  ${incorrectPricingCount} de ${classes.length} clases tienen precio incorrecto`)
    
    // Preguntar si quiere corregir
    console.log(`   🔧 ¿Quieres corregir estos precios? (Ejecuta el script de corrección)`)
  } else {
    console.log(`   ✅ Todas las clases tienen el precio correcto`)
  }
}

// Ejecutar
checkSpecificStudentPricing()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })
