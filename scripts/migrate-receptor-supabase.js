/**
 * Script para migrar campos del receptor usando Supabase directamente
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateReceptorFields() {
  try {
    console.log('Iniciando migración de campos del receptor...')
    
    // Verificar si los campos ya existen
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'students' })
    
    if (tableError) {
      console.log('No se pudo verificar la estructura de la tabla, procediendo con la migración...')
    } else {
      console.log('Estructura actual de la tabla students:', tableInfo)
    }
    
    // Intentar agregar los campos uno por uno
    const fieldsToAdd = [
      'parent_contact_type',
      'student_code', 
      'fixed_schedule',
      'start_date',
      'dni',
      'nif',
      'address',
      'postal_code',
      'city',
      'province',
      'country',
      'receptor_nombre',
      'receptor_apellidos',
      'receptor_email'
    ]
    
    for (const field of fieldsToAdd) {
      try {
        console.log(`Agregando campo: ${field}`)
        
        // Usar SQL directo para agregar columnas
        const { error } = await supabase
          .rpc('exec_sql', { 
            sql: `ALTER TABLE students ADD COLUMN ${field} TEXT` 
          })
        
        if (error) {
          if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
            console.log(`✅ Campo ${field} ya existe`)
          } else {
            console.log(`⚠️  Error agregando campo ${field}:`, error.message)
          }
        } else {
          console.log(`✅ Campo ${field} agregado exitosamente`)
        }
      } catch (err) {
        console.log(`⚠️  Error con campo ${field}:`, err.message)
      }
    }
    
    console.log('\n✅ Migración completada')
    
    // Probar creando un estudiante de prueba
    console.log('\n🧪 Probando creación de estudiante con datos del receptor...')
    
    const testStudent = {
      first_name: 'Test',
      last_name: 'Receptor',
      email: 'test.receptor.migration@example.com',
      birth_date: '2000-01-01',
      phone: '+34123456789',
      parent_phone: '+34987654321',
      parent_contact_type: 'madre',
      course_id: 1,
      student_code: 'TEST-MIGRATION-001',
      start_date: '2024-01-01',
      dni: '12345678A',
      nif: '12345678A',
      address: 'Calle Test 123',
      postal_code: '28001',
      city: 'Madrid',
      province: 'Madrid',
      country: 'España',
      receptor_nombre: 'María',
      receptor_apellidos: 'García López',
      receptor_email: 'maria.garcia@example.com'
    }
    
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .insert(testStudent)
      .select()
      .single()
    
    if (studentError) {
      console.error('❌ Error creando estudiante de prueba:', studentError)
    } else {
      console.log('✅ Estudiante de prueba creado exitosamente:', studentData.id)
      
      // Verificar que se guardaron los datos del receptor
      console.log('📋 Datos del receptor guardados:')
      console.log('  - receptor_nombre:', studentData.receptor_nombre)
      console.log('  - receptor_apellidos:', studentData.receptor_apellidos)
      console.log('  - receptor_email:', studentData.receptor_email)
      
      // Limpiar - eliminar el estudiante de prueba
      await supabase
        .from('students')
        .delete()
        .eq('id', studentData.id)
      
      console.log('🧹 Estudiante de prueba eliminado')
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateReceptorFields()
}

module.exports = { migrateReceptorFields }




