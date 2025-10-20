#!/usr/bin/env node

/**
 * Script para descargar una copia completa de la base de datos de Supabase
 * Incluye todas las tablas con datos y genera archivos SQL y JSON
 * 
 * Uso:
 *   node scripts/backup-supabase-database.js
 *   npm run backup-database
 * 
 * Requiere las siguientes variables de entorno:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - SUPABASE_SERVICE_ROLE_KEY (opcional, para datos más completos)
 */

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuración
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Verificar variables de entorno
function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    logInfo('Asegúrate de tener un archivo .env.local con las credenciales de Supabase');
    process.exit(1);
  }

  logSuccess('Variables de entorno verificadas');
  return true;
}

// Crear directorio de backup
function createBackupDirectory() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    logInfo(`Directorio de backup creado: ${BACKUP_DIR}`);
  }
  
  const timestampDir = path.join(BACKUP_DIR, `backup_${TIMESTAMP}`);
  if (!fs.existsSync(timestampDir)) {
    fs.mkdirSync(timestampDir, { recursive: true });
    logInfo(`Directorio de backup con timestamp creado: ${timestampDir}`);
  }
  
  return timestampDir;
}

// Inicializar cliente de Supabase
function initializeSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logInfo('Usando Service Role Key para acceso completo a los datos');
  } else {
    logWarning('Usando Anon Key - algunos datos pueden estar restringidos por RLS');
  }
  
  return supabase;
}

// Obtener lista de todas las tablas
async function getAllTables(supabase) {
  try {
    // Lista expandida de tablas conocidas del proyecto
    const knownTables = [
      'courses', 'students', 'classes', 'invoices',
      'class_tracking', 'fiscal_config', 'rrsif_events', 'exams',
      'invoice_classes', 'rrsif_invoices', 'monthly_reports',
      'student_preferences', 'student_fiscal_data', 'system_users',
      'user_sessions', 'seguimiento_clases', 'configuracion_fiscal',
      'eventos_rrsif', 'examenes', 'clases_de_factura', 'facturas_rrsif',
      'informes_mensuales', 'preferencias_del_estudiante',
      'datos_fiscales_estudiantes', 'usuarios_sistema', 'sesiones_usuario'
    ];
    
    // Verificar qué tablas existen realmente
    const existingTables = [];
    
    logInfo('Verificando tablas disponibles...');
    
    for (const tableName of knownTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1);
        
        if (!error) {
          existingTables.push(tableName);
          logSuccess(`✅ Tabla ${tableName} encontrada`);
        }
      } catch (err) {
        // Tabla no existe o no accesible - esto es normal
        logWarning(`⚠️  Tabla ${tableName} no accesible: ${err.message}`);
      }
    }
    
    // Intentar obtener tablas dinámicamente usando una consulta SQL
    try {
      const { data: sqlTables, error: sqlError } = await supabase
        .rpc('get_table_names');
      
      if (!sqlError && sqlTables) {
        logInfo('Obteniendo tablas dinámicamente...');
        sqlTables.forEach(table => {
          if (!existingTables.includes(table.table_name)) {
            existingTables.push(table.table_name);
            logSuccess(`✅ Tabla ${table.table_name} encontrada dinámicamente`);
          }
        });
      }
    } catch (err) {
      logWarning('No se pudo obtener tablas dinámicamente, usando lista conocida');
    }
    
    logInfo(`\n📊 Total encontradas: ${existingTables.length} tablas`);
    logInfo(`📋 Tablas: ${existingTables.join(', ')}`);
    
    return existingTables;
  } catch (error) {
    logError(`Error al obtener tablas: ${error.message}`);
    return [];
  }
}

// Obtener esquema de una tabla (simplificado para Supabase)
async function getTableSchema(supabase, tableName) {
  try {
    // Obtener una muestra de datos para inferir el esquema
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);

    if (error) {
      logError(`Error obteniendo muestra de ${tableName}: ${error.message}`);
      return null;
    }

    if (!data || data.length === 0) {
      logWarning(`Tabla ${tableName} está vacía, no se puede inferir esquema`);
      return [];
    }

    // Inferir esquema básico desde los datos
    const sampleRow = data[0];
    const schema = Object.keys(sampleRow).map(columnName => ({
      column_name: columnName,
      data_type: typeof sampleRow[columnName] === 'number' ? 'INTEGER' : 
                 typeof sampleRow[columnName] === 'boolean' ? 'BOOLEAN' : 'TEXT',
      is_nullable: 'YES',
      column_default: null,
      character_maximum_length: null
    }));

    return schema;
  } catch (error) {
    logError(`Error al obtener esquema de ${tableName}: ${error.message}`);
    return null;
  }
}

// Obtener todos los datos de una tabla
async function getTableData(supabase, tableName) {
  try {
    logInfo(`Obteniendo datos de la tabla: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('id');

    if (error) {
      logError(`Error obteniendo datos de ${tableName}: ${error.message}`);
      return null;
    }

    logSuccess(`${tableName}: ${data.length} registros obtenidos`);
    return data;
  } catch (error) {
    logError(`Error al obtener datos de ${tableName}: ${error.message}`);
    return null;
  }
}

// Generar SQL CREATE TABLE
function generateCreateTableSQL(tableName, schema) {
  let sql = `-- Tabla: ${tableName}\n`;
  sql += `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
  
  const columns = schema.map(col => {
    let columnDef = `  "${col.column_name}" ${col.data_type}`;
    
    if (col.character_maximum_length) {
      columnDef += `(${col.character_maximum_length})`;
    }
    
    if (col.is_nullable === 'NO') {
      columnDef += ' NOT NULL';
    }
    
    if (col.column_default) {
      columnDef += ` DEFAULT ${col.column_default}`;
    }
    
    return columnDef;
  });
  
  sql += columns.join(',\n');
  sql += '\n);\n\n';
  
  return sql;
}

// Generar SQL INSERT
function generateInsertSQL(tableName, data) {
  if (!data || data.length === 0) {
    return `-- No hay datos en la tabla ${tableName}\n\n`;
  }

  let sql = `-- Datos de la tabla: ${tableName}\n`;
  
  // Obtener columnas del primer registro
  const columns = Object.keys(data[0]);
  const columnNames = columns.map(col => `"${col}"`).join(', ');
  
  sql += `INSERT INTO "${tableName}" (${columnNames}) VALUES\n`;
  
  const values = data.map(row => {
    const rowValues = columns.map(col => {
      const value = row[col];
      if (value === null) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
      if (value instanceof Date) return `'${value.toISOString()}'`;
      return value;
    });
    return `  (${rowValues.join(', ')})`;
  });
  
  sql += values.join(',\n');
  sql += ';\n\n';
  
  return sql;
}

// Guardar datos como JSON
function saveAsJSON(data, filePath) {
  const jsonData = {
    timestamp: new Date().toISOString(),
    table: path.basename(filePath, '.json'),
    recordCount: data.length,
    data: data
  };
  
  fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  logSuccess(`Datos guardados como JSON: ${filePath}`);
}

// Generar reporte de backup
function generateBackupReport(backupDir, tables, stats) {
  const reportPath = path.join(backupDir, 'backup-report.md');
  
  let report = `# Reporte de Backup de Base de Datos\n\n`;
  report += `**Fecha:** ${new Date().toLocaleString()}\n`;
  report += `**Timestamp:** ${TIMESTAMP}\n\n`;
  
  report += `## Resumen\n\n`;
  report += `- **Total de tablas:** ${tables.length}\n`;
  report += `- **Total de registros:** ${stats.totalRecords}\n`;
  report += `- **Archivos generados:** ${stats.filesGenerated}\n\n`;
  
  report += `## Tablas Exportadas\n\n`;
  report += `| Tabla | Registros | Archivos |\n`;
  report += `|-------|-----------|----------|\n`;
  
  tables.forEach(table => {
    const recordCount = stats.tableRecords[table] || 0;
    const files = `\`${table}.sql\`, \`${table}.json\``;
    report += `| ${table} | ${recordCount} | ${files} |\n`;
  });
  
  report += `\n## Archivos Generados\n\n`;
  report += `- \`complete-database.sql\` - Script SQL completo para recrear la base de datos\n`;
  report += `- \`schema-only.sql\` - Solo la estructura de las tablas\n`;
  report += `- \`data-only.sql\` - Solo los datos (INSERT statements)\n`;
  report += `- \`${tables.map(t => `${t}.sql`).join('`, `')}\` - Archivos individuales por tabla\n`;
  report += `- \`${tables.map(t => `${t}.json`).join('`, `')}\` - Datos en formato JSON\n`;
  
  report += `\n## Instrucciones de Restauración\n\n`;
  report += `### Opción 1: Restaurar Base de Datos Completa\n`;
  report += `\`\`\`sql\n`;
  report += `-- Ejecutar en Supabase SQL Editor o cliente PostgreSQL\n`;
  report += `\\i complete-database.sql\n`;
  report += `\`\`\`\n\n`;
  
  report += `### Opción 2: Restaurar Solo Datos\n`;
  report += `\`\`\`sql\n`;
  report += `-- Primero crear las tablas, luego ejecutar:\n`;
  report += `\\i data-only.sql\n`;
  report += `\`\`\`\n\n`;
  
  report += `### Opción 3: Restaurar Tabla Individual\n`;
  report += `\`\`\`sql\n`;
  report += `-- Ejecutar el archivo SQL de la tabla específica\n`;
  report += `\\i nombre_tabla.sql\n`;
  report += `\`\`\`\n\n`;
  
  fs.writeFileSync(reportPath, report);
  logSuccess(`Reporte de backup generado: ${reportPath}`);
}

// Función principal
async function main() {
  log('🚀 Iniciando backup de base de datos de Supabase...', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    // 1. Verificar variables de entorno
    checkEnvironmentVariables();
    
    // 2. Crear directorio de backup
    const backupDir = createBackupDirectory();
    
    // 3. Inicializar cliente de Supabase
    const supabase = initializeSupabaseClient();
    
    // 4. Obtener lista de tablas
    const tables = await getAllTables(supabase);
    if (tables.length === 0) {
      logError('No se encontraron tablas para exportar');
      process.exit(1);
    }
    
    // 5. Procesar cada tabla
    const stats = {
      totalRecords: 0,
      filesGenerated: 0,
      tableRecords: {}
    };
    
    let completeSQL = '';
    let schemaSQL = '';
    let dataSQL = '';
    
    for (const tableName of tables) {
      log(`\n📋 Procesando tabla: ${tableName}`, 'magenta');
      
      // Obtener esquema
      const schema = await getTableSchema(supabase, tableName);
      if (!schema) continue;
      
      // Obtener datos
      const data = await getTableData(supabase, tableName);
      if (data === null) continue;
      
      // Actualizar estadísticas
      stats.tableRecords[tableName] = data.length;
      stats.totalRecords += data.length;
      
      // Generar SQL
      const createSQL = generateCreateTableSQL(tableName, schema);
      const insertSQL = generateInsertSQL(tableName, data);
      
      // Guardar archivo individual de tabla
      const tableSQLPath = path.join(backupDir, `${tableName}.sql`);
      fs.writeFileSync(tableSQLPath, createSQL + insertSQL);
      stats.filesGenerated++;
      
      // Guardar datos como JSON
      const tableJSONPath = path.join(backupDir, `${tableName}.json`);
      saveAsJSON(data, tableJSONPath);
      stats.filesGenerated++;
      
      // Acumular para archivos completos
      completeSQL += createSQL + insertSQL;
      schemaSQL += createSQL;
      dataSQL += insertSQL;
      
      logSuccess(`Tabla ${tableName} procesada exitosamente`);
    }
    
    // 6. Guardar archivos completos
    const completeSQLPath = path.join(backupDir, 'complete-database.sql');
    fs.writeFileSync(completeSQLPath, completeSQL);
    stats.filesGenerated++;
    
    const schemaSQLPath = path.join(backupDir, 'schema-only.sql');
    fs.writeFileSync(schemaSQLPath, schemaSQL);
    stats.filesGenerated++;
    
    const dataSQLPath = path.join(backupDir, 'data-only.sql');
    fs.writeFileSync(dataSQLPath, dataSQL);
    stats.filesGenerated++;
    
    // 7. Generar reporte
    generateBackupReport(backupDir, tables, stats);
    
    // 8. Resumen final
    log('\n' + '=' .repeat(60), 'green');
    logSuccess('¡Backup completado exitosamente!');
    logInfo(`Directorio de backup: ${backupDir}`);
    logInfo(`Total de tablas: ${tables.length}`);
    logInfo(`Total de registros: ${stats.totalRecords}`);
    logInfo(`Archivos generados: ${stats.filesGenerated}`);
    log('=' .repeat(60), 'green');
    
  } catch (error) {
    logError(`Error durante el backup: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
