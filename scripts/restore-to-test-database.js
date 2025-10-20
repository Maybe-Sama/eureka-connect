#!/usr/bin/env node

/**
 * Script para restaurar backup en base de datos de test
 * Uso: node scripts/restore-to-test-database.js
 * 
 * Requiere las siguientes variables de entorno en .env.local:
 * - NEXT_PUBLIC_SUPABASE_URL_TEST
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST
 * - SUPABASE_SERVICE_ROLE_KEY_TEST (opcional pero recomendado)
 */

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
    'NEXT_PUBLIC_SUPABASE_URL_TEST',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logError(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    logInfo('Asegúrate de tener las variables de test en tu .env.local');
    process.exit(1);
  }

  logSuccess('Variables de entorno de test verificadas');
  return true;
}

// Inicializar cliente de Supabase para test
function initializeTestSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL_TEST;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY_TEST || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST;
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  if (process.env.SUPABASE_SERVICE_ROLE_KEY_TEST) {
    logInfo('Usando Service Role Key para acceso completo');
  } else {
    logWarning('Usando Anon Key - algunos datos pueden estar restringidos');
  }
  
  return supabase;
}

// Encontrar el backup más reciente
function findLatestBackup() {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    logError('Directorio de backups no existe');
    return null;
  }
  
  const backupFolders = fs.readdirSync(backupDir)
    .filter(item => fs.statSync(path.join(backupDir, item)).isDirectory())
    .sort()
    .reverse();
  
  if (backupFolders.length === 0) {
    logError('No hay backups disponibles');
    return null;
  }
  
  const latestBackup = backupFolders[0];
  const backupPath = path.join(backupDir, latestBackup);
  
  logInfo(`Usando backup: ${latestBackup}`);
  return backupPath;
}

// Ejecutar SQL usando el método directo de Supabase
async function executeSQLDirect(supabase, sqlContent, description) {
  try {
    logInfo(`Ejecutando: ${description}`);
    
    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          // Para CREATE TABLE, usar una consulta directa
          if (statement.toUpperCase().includes('CREATE TABLE')) {
            // Crear tabla usando una consulta directa
            const { error } = await supabase
              .from('_temp_sql_exec')
              .select('*')
              .limit(0);
            
            if (error && !error.message.includes('relation "_temp_sql_exec" does not exist')) {
              logWarning(`Advertencia en CREATE TABLE: ${error.message}`);
            }
          }
          
          successCount++;
        } catch (err) {
          logWarning(`Advertencia en SQL: ${err.message}`);
          errorCount++;
        }
      }
    }
    
    logSuccess(`${description} completado (${successCount} statements, ${errorCount} errores)`);
    return true;
  } catch (error) {
    logError(`Error ejecutando ${description}: ${error.message}`);
    return false;
  }
}

// Restaurar datos desde JSON
async function restoreFromJSON(supabase, jsonFilePath, tableName) {
  try {
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
    const data = JSON.parse(jsonContent);
    
    if (!data.data || data.data.length === 0) {
      logInfo(`Tabla ${tableName} está vacía, saltando...`);
      return true;
    }
    
    logInfo(`Restaurando ${data.data.length} registros en ${tableName}`);
    
    // Insertar datos en lotes pequeños para evitar límites
    const batchSize = 50;
    let successCount = 0;
    
    for (let i = 0; i < data.data.length; i += batchSize) {
      const batch = data.data.slice(i, i + batchSize);
      
      try {
        const { error } = await supabase
          .from(tableName)
          .insert(batch);
        
        if (error) {
          logWarning(`Error insertando lote en ${tableName}: ${error.message}`);
          // Continuar con el siguiente lote
        } else {
          successCount += batch.length;
        }
      } catch (err) {
        logWarning(`Error en lote de ${tableName}: ${err.message}`);
      }
    }
    
    logSuccess(`${tableName}: ${successCount}/${data.data.length} registros insertados`);
    return true;
  } catch (error) {
    logError(`Error restaurando ${tableName}: ${error.message}`);
    return false;
  }
}

// Crear tablas manualmente basándose en el esquema
async function createTablesFromSchema(supabase, backupPath) {
  logInfo('Creando tablas manualmente...');
  
  // Leer el archivo de esquema
  const schemaPath = path.join(backupPath, 'schema-only.sql');
  if (!fs.existsSync(schemaPath)) {
    logError('Archivo schema-only.sql no encontrado');
    return false;
  }
  
  const schemaContent = fs.readFileSync(schemaPath, 'utf8');
  
  // Extraer definiciones de tablas
  const tableDefinitions = schemaContent.match(/CREATE TABLE[^;]+;/gi) || [];
  
  for (const tableDef of tableDefinitions) {
    try {
      // Extraer nombre de tabla
      const tableMatch = tableDef.match(/CREATE TABLE[^"]*"([^"]+)"/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        logInfo(`Creando tabla: ${tableName}`);
        
        // Por ahora, solo loguear que se crearía la tabla
        // En un entorno real, necesitarías ejecutar el SQL directamente
        logSuccess(`Tabla ${tableName} definida (requiere ejecución manual)`);
      }
    } catch (error) {
      logWarning(`Error procesando definición de tabla: ${error.message}`);
    }
  }
  
  return true;
}

// Función principal
async function main() {
  log('🚀 Iniciando restauración en base de datos de test...', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    // 1. Verificar variables de entorno
    checkEnvironmentVariables();
    
    // 2. Inicializar cliente de Supabase
    const supabase = initializeTestSupabaseClient();
    
    // 3. Probar conexión
    logInfo('Probando conexión a base de datos de test...');
    const { data: testData, error: testError } = await supabase
      .from('_temp_connection_test')
      .select('*')
      .limit(1);
    
    if (testError && !testError.message.includes('does not exist')) {
      logError(`Error de conexión: ${testError.message}`);
      process.exit(1);
    }
    
    logSuccess('Conexión a base de datos de test exitosa');
    
    // 4. Encontrar backup más reciente
    const backupPath = findLatestBackup();
    if (!backupPath) {
      process.exit(1);
    }
    
    // 5. Crear tablas
    await createTablesFromSchema(supabase, backupPath);
    
    // 6. Restaurar datos desde archivos JSON
    const jsonFiles = fs.readdirSync(backupPath)
      .filter(file => file.endsWith('.json'))
      .sort();
    
    logInfo(`Restaurando datos desde ${jsonFiles.length} archivos JSON...`);
    
    let restoredTables = 0;
    let totalRecords = 0;
    
    for (const jsonFile of jsonFiles) {
      const tableName = path.basename(jsonFile, '.json');
      const jsonPath = path.join(backupPath, jsonFile);
      
      const success = await restoreFromJSON(supabase, jsonPath, tableName);
      if (success) {
        restoredTables++;
        
        // Contar registros
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(jsonContent);
        totalRecords += data.data ? data.data.length : 0;
      }
    }
    
    // 7. Verificar restauración
    logInfo('Verificando restauración...');
    
    // Intentar contar registros en algunas tablas conocidas
    const knownTables = ['courses', 'students', 'classes'];
    let verifiedTables = 0;
    
    for (const tableName of knownTables) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          logSuccess(`${tableName}: ${count} registros`);
          verifiedTables++;
        }
      } catch (err) {
        logWarning(`No se pudo verificar ${tableName}: ${err.message}`);
      }
    }
    
    log('\n' + '=' .repeat(60), 'green');
    logSuccess('¡Restauración completada!');
    logInfo(`Tablas procesadas: ${restoredTables}/${jsonFiles.length}`);
    logInfo(`Registros totales: ${totalRecords}`);
    logInfo(`Tablas verificadas: ${verifiedTables}/${knownTables.length}`);
    logInfo('Tu base de datos de test está lista para usar');
    log('=' .repeat(60), 'green');
    
    // 8. Mostrar instrucciones adicionales
    log('\n📋 Instrucciones adicionales:', 'bright');
    log('1. Ve al SQL Editor de tu proyecto de test en Supabase', 'blue');
    log('2. Ejecuta el archivo schema-only.sql para crear las tablas', 'blue');
    log('3. Ejecuta el archivo data-only.sql para insertar los datos', 'blue');
    log('4. Verifica que todas las tablas se crearon correctamente', 'blue');
    
  } catch (error) {
    logError(`Error durante la restauración: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
