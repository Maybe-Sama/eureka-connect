/**
 * Script simple para migrar campos del receptor
 * Ejecuta SQL directamente en Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas')
  console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function migrateReceptorFields() {
  try {
    console.log('🚀 Iniciando migración de campos del receptor...')
    console.log('URL de Supabase:', supabaseUrl)
    
    // Lista de campos a agregar
    const fieldsToAdd = [
      { name: 'parent_contact_type', type: 'TEXT' },
      { name: 'student_code', type: 'TEXT' },
      { name: 'fixed_schedule', type: 'TEXT' },
      { name: 'start_date', type: 'TEXT' },
      { name: 'dni', type: 'TEXT' },
      { name: 'nif', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'postal_code', type: 'TEXT' },
      { name: 'city', type: 'TEXT' },
      { name: 'province', type: 'TEXT' },
      { name: 'country', type: 'TEXT DEFAULT "España"' },
      { name: 'receptor_nombre', type: 'TEXT' },
      { name: 'receptor_apellidos', type: 'TEXT' },
      { name: 'receptor_email', type: 'TEXT' }
    ]
    
    console.log('\n📋 Agregando campos a la tabla students...')
    
    for (const field of fieldsToAdd) {
      try {
        console.log(`➕ Agregando campo: ${field.name}`)
        
        const { error } = await supabase
          .rpc('exec', { 
            sql: `ALTER TABLE students ADD COLUMN ${field.name} ${field.type}` 
          })
        
        if (error) {
          if (error.message.includes('duplicate column name') || 
              error.message.includes('already exists') ||
              error.message.includes('column already exists')) {
            console.log(`✅ Campo ${field.name} ya existe`)
          } else {
            console.log(`⚠️  Error agregando campo ${field.name}:`, error.message)
          }
        } else {
          console.log(`✅ Campo ${field.name} agregado exitosamente`)
        }
      } catch (err) {
        console.log(`⚠️  Error con campo ${field.name}:`, err.message)
      }
    }
    
    console.log('\n🧪 Probando migración con estudiante de prueba...')
    
    // Crear un estudiante de prueba
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
      console.log('Esto puede indicar que la migración no se completó correctamente')
    } else {
      console.log('✅ Estudiante de prueba creado exitosamente con ID:', studentData.id)
      
      // Verificar datos del receptor
      console.log('\n📋 Verificando datos del receptor:')
      console.log('  - receptor_nombre:', studentData.receptor_nombre || 'NO GUARDADO')
      console.log('  - receptor_apellidos:', studentData.receptor_apellidos || 'NO GUARDADO')
      console.log('  - receptor_email:', studentData.receptor_email || 'NO GUARDADO')
      
      if (studentData.receptor_nombre && studentData.receptor_apellidos && studentData.receptor_email) {
        console.log('🎉 ¡Migración exitosa! Los datos del receptor se guardan correctamente')
      } else {
        console.log('❌ Los datos del receptor NO se guardaron. La migración puede haber fallado')
      }
      
      // Limpiar
      await supabase
        .from('students')
        .delete()
        .eq('id', studentData.id)
      
      console.log('🧹 Estudiante de prueba eliminado')
    }
    
    console.log('\n✅ Migración completada')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateReceptorFields()
}

module.exports = { migrateReceptorFields }




