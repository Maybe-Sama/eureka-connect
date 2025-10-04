/**
 * Script para inicializar las tablas de facturas RRSIF usando better-sqlite3
 */

const Database = require('better-sqlite3')
const fs = require('fs')
const path = require('path')

async function initFacturasDB() {
  try {
    console.log('Inicializando base de datos de facturas RRSIF...')
    
    // Ruta de la base de datos
    const dbPath = path.join(__dirname, '..', 'database', 'crm.db')
    
    // Verificar que existe el directorio database
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
      console.log('Directorio database creado')
    }
    
    // Conectar a la base de datos
    const db = new Database(dbPath)
    
    // Leer el esquema de facturas
    const schemaPath = path.join(__dirname, '..', 'database', 'facturas-schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    // Ejecutar el esquema
    try {
      db.exec(schema)
      console.log('✅ Tablas de facturas RRSIF creadas exitosamente')
      
      // Verificar que las tablas se crearon
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%factura%'").all()
      console.log('📋 Tablas creadas:', tables.map(t => t.name))
      
      console.log('✅ Base de datos inicializada correctamente')
    } catch (err) {
      console.error('Error ejecutando esquema de facturas:', err)
      process.exit(1)
    } finally {
      db.close()
    }
    
  } catch (error) {
    console.error('Error inicializando base de datos:', error)
    process.exit(1)
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initFacturasDB()
}

module.exports = { initFacturasDB }










