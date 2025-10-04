/**
 * Script para diagnosticar problemas con la carga de estudiantes
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  console.log('Creando cliente con valores por defecto...')
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)

async function debugStudentsLoading() {
  try {
    console.log('🔍 Diagnosticando problemas con la carga de estudiantes...')
    
    // 1. Verificar estructura de la tabla students
    console.log('\n1. Verificando estructura de la tabla students...')
    try {
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('exec', { 
          sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students' ORDER BY ordinal_position` 
        })
      
      if (tableError) {
        console.log('⚠️  No se pudo obtener información de la tabla:', tableError.message)
      } else {
        console.log('📋 Columnas de la tabla students:')
        tableInfo.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type}`)
        })
      }
    } catch (err) {
      console.log('⚠️  Error verificando estructura:', err.message)
    }
    
    // 2. Verificar si hay estudiantes en la tabla
    console.log('\n2. Verificando estudiantes en la tabla...')
    try {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, email')
        .limit(5)
      
      if (studentsError) {
        console.error('❌ Error cargando estudiantes:', studentsError)
      } else {
        console.log(`✅ Encontrados ${students.length} estudiantes:`)
        students.forEach(student => {
          console.log(`  - ${student.first_name} ${student.last_name} (${student.email})`)
        })
      }
    } catch (err) {
      console.error('❌ Error en consulta de estudiantes:', err.message)
    }
    
    // 3. Verificar relación con cursos
    console.log('\n3. Verificando relación con cursos...')
    try {
      const { data: studentsWithCourses, error: coursesError } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          course_id,
          courses:course_id (
            id,
            name,
            price,
            color
          )
        `)
        .limit(3)
      
      if (coursesError) {
        console.error('❌ Error cargando estudiantes con cursos:', coursesError)
      } else {
        console.log('✅ Relación con cursos funcionando:')
        studentsWithCourses.forEach(student => {
          console.log(`  - ${student.first_name}: Curso ${student.courses?.name || 'SIN CURSO'}`)
        })
      }
    } catch (err) {
      console.error('❌ Error en consulta de relación:', err.message)
    }
    
    // 4. Verificar campos del receptor
    console.log('\n4. Verificando campos del receptor...')
    try {
      const { data: receptorData, error: receptorError } = await supabase
        .from('students')
        .select('id, first_name, receptor_nombre, receptor_apellidos, receptor_email')
        .not('receptor_nombre', 'is', null)
        .limit(3)
      
      if (receptorError) {
        console.error('❌ Error cargando datos del receptor:', receptorError)
      } else {
        console.log(`✅ Encontrados ${receptorData.length} estudiantes con datos del receptor:`)
        receptorData.forEach(student => {
          console.log(`  - ${student.first_name}: Receptor ${student.receptor_nombre} ${student.receptor_apellidos}`)
        })
      }
    } catch (err) {
      console.error('❌ Error en consulta de receptor:', err.message)
    }
    
    // 5. Probar consulta completa como la API
    console.log('\n5. Probando consulta completa como la API...')
    try {
      const { data: fullStudents, error: fullError } = await supabase
        .from('students')
        .select(`
          *,
          courses:course_id (
            id,
            name,
            price,
            color
          )
        `)
        .order('first_name')
        .limit(3)
      
      if (fullError) {
        console.error('❌ Error en consulta completa:', fullError)
      } else {
        console.log('✅ Consulta completa funcionando:')
        fullStudents.forEach(student => {
          console.log(`  - ${student.first_name} ${student.last_name}`)
          console.log(`    Curso: ${student.courses?.name || 'SIN CURSO'}`)
          console.log(`    Receptor: ${student.receptor_nombre || 'NO DEFINIDO'}`)
        })
      }
    } catch (err) {
      console.error('❌ Error en consulta completa:', err.message)
    }
    
    console.log('\n✅ Diagnóstico completado')
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  debugStudentsLoading()
}

module.exports = { debugStudentsLoading }




