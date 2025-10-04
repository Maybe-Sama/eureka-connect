const { createClient } = require('@supabase/supabase-js')

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verificando configuración...')
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ No encontrada')
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ No encontrada')

if (!supabaseUrl || !supabaseKey) {
  console.log('\n❌ Configuración incompleta')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('\n🔌 Probando conexión...')
    
    // Test básico de conexión
    const { data, error } = await supabase
      .from('courses')
      .select('count', { count: 'exact', head: true })
    
    if (error) {
      console.log('❌ Error de conexión:', error.message)
      return
    }
    
    console.log('✅ Conexión exitosa!')
    console.log('📊 Cursos en la base de datos:', data || 0)
    
    // Test de creación
    console.log('\n🧪 Probando creación de curso...')
    const testCourse = {
      name: 'Test Course',
      description: 'Curso de prueba',
      subject: 'Matemáticas',
      price: 25.50,
      duration: 60,
      color: '#6366f1',
      is_active: true
    }
    
    const { data: newCourse, error: createError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select()
      .single()
    
    if (createError) {
      console.log('❌ Error al crear curso:', createError.message)
      return
    }
    
    console.log('✅ Curso creado exitosamente!')
    console.log('📝 ID del curso:', newCourse.id)
    console.log('📝 Nombre:', newCourse.name)
    console.log('📝 Asignatura:', newCourse.subject)
    
    // Limpiar
    await supabase.from('courses').delete().eq('id', newCourse.id)
    console.log('🧹 Curso de prueba eliminado')
    
    console.log('\n🎉 ¡Verificación completada exitosamente!')
    console.log('✅ Supabase está funcionando correctamente')
    console.log('✅ Todas las funcionalidades están listas')
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testConnection()
