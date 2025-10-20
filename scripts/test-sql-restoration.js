#!/usr/bin/env node

/**
 * Script para probar que los archivos SQL generados son válidos
 * Verifica la sintaxis y estructura de los archivos SQL
 */

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: '.env.local' });

const fs = require('fs');
const path = require('path');

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

// Verificar sintaxis SQL básica
function validateSQLSyntax(sqlContent, filename) {
  const issues = [];
  
  // Verificar que tiene CREATE TABLE (excepto para data-only.sql)
  if (!sqlContent.includes('CREATE TABLE') && !filename.includes('data-only')) {
    issues.push('No contiene CREATE TABLE statements');
  }
  
  // Verificar que tiene INSERT INTO (excepto para schema-only.sql y tablas vacías)
  if (!sqlContent.includes('INSERT INTO') && !filename.includes('schema-only')) {
    // Verificar si es una tabla vacía (solo tiene comentarios)
    const hasDataComment = sqlContent.includes('No hay datos en la tabla');
    if (!hasDataComment) {
      issues.push('No contiene INSERT INTO statements');
    }
  }
  
  // Verificar paréntesis balanceados
  const openParens = (sqlContent.match(/\(/g) || []).length;
  const closeParens = (sqlContent.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    issues.push(`Paréntesis desbalanceados: ${openParens} abiertos, ${closeParens} cerrados`);
  }
  
  // Verificar comillas balanceadas
  const singleQuotes = (sqlContent.match(/'/g) || []).length;
  if (singleQuotes % 2 !== 0) {
    issues.push('Comillas simples desbalanceadas');
  }
  
  // Verificar que termina con punto y coma
  const lines = sqlContent.split('\n');
  const lastLine = lines[lines.length - 1].trim();
  if (lastLine && !lastLine.endsWith(';')) {
    issues.push('No termina con punto y coma');
  }
  
  return issues;
}

// Verificar archivo SQL individual
function validateSQLFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);
    
    logInfo(`Validando ${filename}...`);
    
    const issues = validateSQLSyntax(content, filename);
    
    if (issues.length === 0) {
      logSuccess(`${filename} - Sintaxis SQL válida`);
      return true;
    } else {
      logError(`${filename} - Problemas encontrados:`);
      issues.forEach(issue => log(`  - ${issue}`, 'red'));
      return false;
    }
    
  } catch (error) {
    logError(`Error leyendo ${filePath}: ${error.message}`);
    return false;
  }
}

// Contar registros en archivo SQL
function countRecordsInSQL(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const insertMatches = content.match(/INSERT INTO/g);
    const recordCount = insertMatches ? insertMatches.length : 0;
    
    // Si es un archivo con múltiples INSERT en una sola línea
    const valuesMatches = content.match(/VALUES\s*\(/g);
    const totalRecords = valuesMatches ? valuesMatches.length : recordCount;
    
    return totalRecords;
  } catch (error) {
    return 0;
  }
}

// Función principal
async function main() {
  log('🧪 Iniciando validación de archivos SQL de backup...', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      logError('Directorio de backups no existe');
      process.exit(1);
    }
    
    // Encontrar el backup más reciente
    const backupFolders = fs.readdirSync(backupDir)
      .filter(item => fs.statSync(path.join(backupDir, item)).isDirectory())
      .sort()
      .reverse();
    
    if (backupFolders.length === 0) {
      logError('No hay backups disponibles');
      process.exit(1);
    }
    
    const latestBackup = backupFolders[0];
    const backupPath = path.join(backupDir, latestBackup);
    
    logInfo(`Validando backup: ${latestBackup}`);
    
    // Obtener archivos SQL
    const sqlFiles = fs.readdirSync(backupPath)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    logInfo(`Encontrados ${sqlFiles.length} archivos SQL para validar`);
    
    let validFiles = 0;
    let totalRecords = 0;
    
    // Validar cada archivo SQL
    for (const sqlFile of sqlFiles) {
      const filePath = path.join(backupPath, sqlFile);
      const isValid = validateSQLFile(filePath);
      
      if (isValid) {
        validFiles++;
        const recordCount = countRecordsInSQL(filePath);
        totalRecords += recordCount;
        logInfo(`  Registros en ${sqlFile}: ${recordCount}`);
      }
    }
    
    // Validar archivos especiales
    const specialFiles = ['complete-database.sql', 'schema-only.sql', 'data-only.sql'];
    
    log('\n📋 Validando archivos especiales:', 'bright');
    for (const specialFile of specialFiles) {
      const filePath = path.join(backupPath, specialFile);
      if (fs.existsSync(filePath)) {
        const isValid = validateSQLFile(filePath);
        if (isValid) {
          const recordCount = countRecordsInSQL(filePath);
          logInfo(`  Registros en ${specialFile}: ${recordCount}`);
        }
      } else {
        logWarning(`${specialFile} no encontrado`);
      }
    }
    
    // Resumen final
    log('\n' + '=' .repeat(60), validFiles === sqlFiles.length ? 'green' : 'yellow');
    
    if (validFiles === sqlFiles.length) {
      logSuccess('¡Todos los archivos SQL son válidos!');
      logInfo(`Archivos válidos: ${validFiles}/${sqlFiles.length}`);
      logInfo(`Total de registros: ${totalRecords}`);
      logInfo('Los archivos están listos para restauración');
    } else {
      logWarning(`Algunos archivos tienen problemas: ${validFiles}/${sqlFiles.length} válidos`);
    }
    
    log('=' .repeat(60), validFiles === sqlFiles.length ? 'green' : 'yellow');
    
  } catch (error) {
    logError(`Error durante la validación: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
