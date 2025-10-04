/**
 * Script para agregar campos del receptor a la tabla students
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

async function migrateAddReceptorFields() {
  try {
    console.log('Iniciando migración: Agregando campos del receptor a la tabla students...')
    
    // Ruta de la base de datos
    const dbPath = path.join(__dirname, '..', 'database', 'crm.db')
    
    // Verificar que existe la base de datos
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Base de datos no encontrada en:', dbPath)
      process.exit(1)
    }
    
    // Conectar a la base de datos
    const db = new Database(dbPath)
    
    // Verificar si los campos ya existen
    const tableInfo = db.prepare("PRAGMA table_info(students)").all()
    const existingColumns = tableInfo.map(col => col.name)
    
    console.log('📋 Columnas existentes en students:', existingColumns)
    
    // Campos a agregar
    const newFields = [
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
    
    // Agregar campos que no existen
    for (const field of newFields) {
      if (!existingColumns.includes(field)) {
        let columnType = 'TEXT'
        
        // Tipos específicos para algunos campos
        if (field === 'parent_contact_type') {
          columnType = 'TEXT CHECK(parent_contact_type IN ("padre", "madre", "tutor"))'
        } else if (field === 'fixed_schedule') {
          columnType = 'TEXT' // JSON string
        } else if (field === 'start_date' || field === 'birth_date') {
          columnType = 'TEXT' // YYYY-MM-DD format
        }
        
        try {
          const sql = `ALTER TABLE students ADD COLUMN ${field} ${columnType}`
          console.log(`➕ Agregando campo: ${field}`)
          db.exec(sql)
          console.log(`✅ Campo ${field} agregado exitosamente`)
        } catch (error) {
          console.error(`❌ Error agregando campo ${field}:`, error.message)
        }
      } else {
        console.log(`⏭️  Campo ${field} ya existe, omitiendo`)
      }
    }
    
    // Verificar la estructura final
    const finalTableInfo = db.prepare("PRAGMA table_info(students)").all()
    console.log('\n📋 Estructura final de la tabla students:')
    finalTableInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`)
    })
    
    console.log('\n✅ Migración completada exitosamente')
    
  } catch (error) {
    console.error('❌ Error durante la migración:', error)
    process.exit(1)
  } finally {
    if (db) {
      db.close()
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  migrateAddReceptorFields()
}

module.exports = { migrateAddReceptorFields }




