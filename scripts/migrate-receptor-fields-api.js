/**
 * Script para agregar campos del receptor usando la API de la aplicación
 */

const fs = require('fs')
const path = require('path')

async function migrateReceptorFieldsViaAPI() {
  try {
    console.log('Iniciando migración: Agregando campos del receptor a la tabla students...')
    
    // Verificar que existe la base de datos
    const dbPath = path.join(__dirname, '..', 'database', 'crm.db')
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Base de datos no encontrada en:', dbPath)
      process.exit(1)
    }
    
    console.log('📋 Base de datos encontrada, procediendo con migración...')
    
    // Crear un script SQL para la migración
    const migrationSQL = `
-- Migración: Agregar campos del receptor a la tabla students
-- Ejecutar este SQL en la base de datos

-- Agregar campos que no existen
ALTER TABLE students ADD COLUMN parent_contact_type TEXT CHECK(parent_contact_type IN ("padre", "madre", "tutor"));
ALTER TABLE students ADD COLUMN student_code TEXT;
ALTER TABLE students ADD COLUMN fixed_schedule TEXT;
ALTER TABLE students ADD COLUMN start_date TEXT;
ALTER TABLE students ADD COLUMN dni TEXT;
ALTER TABLE students ADD COLUMN nif TEXT;
ALTER TABLE students ADD COLUMN address TEXT;
ALTER TABLE students ADD COLUMN postal_code TEXT;
ALTER TABLE students ADD COLUMN city TEXT;
ALTER TABLE students ADD COLUMN province TEXT;
ALTER TABLE students ADD COLUMN country TEXT DEFAULT 'España';
ALTER TABLE students ADD COLUMN receptor_nombre TEXT;
ALTER TABLE students ADD COLUMN receptor_apellidos TEXT;
ALTER TABLE students ADD COLUMN receptor_email TEXT;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_dni ON students(dni);
CREATE INDEX IF NOT EXISTS idx_students_nif ON students(nif);
CREATE INDEX IF NOT EXISTS idx_students_receptor_email ON students(receptor_email);
`
    
    // Guardar el script SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'migrate-receptor-fields.sql')
    fs.writeFileSync(sqlPath, migrationSQL)
    
    console.log('✅ Script SQL de migración creado en:', sqlPath)
    console.log('\n📋 Para completar la migración, ejecuta el siguiente SQL en tu base de datos:')
    console.log('=' * 60)
    console.log(migrationSQL)
    console.log('=' * 60)
    
    console.log('\n💡 Alternativamente, puedes:')
    console.log('1. Abrir la base de datos con un cliente SQLite')
    console.log('2. Ejecutar el archivo:', sqlPath)
    console.log('3. O ejecutar cada comando ALTER TABLE individualmente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateReceptorFieldsViaAPI()
}

module.exports = { migrateReceptorFieldsViaAPI }




