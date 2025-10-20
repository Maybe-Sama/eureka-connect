#!/usr/bin/env node

/**
 * Ejemplo de uso del script de backup de Supabase
 * Este archivo muestra diferentes formas de usar el script de backup
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

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

// Ejecutar comando y retornar promesa
function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

// Ejemplo 1: Verificar dependencias antes del backup
async function example1_CheckDependencies() {
  log('\n📋 Ejemplo 1: Verificar dependencias', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    logInfo('Ejecutando verificación de dependencias...');
    const result = await runCommand('pnpm run test-backup');
    logSuccess('Verificación completada');
    console.log(result.stdout);
  } catch (error) {
    logError(`Error en verificación: ${error.message}`);
  }
}

// Ejemplo 2: Crear backup básico
async function example2_CreateBackup() {
  log('\n📋 Ejemplo 2: Crear backup básico', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    logInfo('Creando backup de la base de datos...');
    const result = await runCommand('pnpm run backup-database');
    logSuccess('Backup completado');
    console.log(result.stdout);
  } catch (error) {
    logError(`Error en backup: ${error.message}`);
  }
}

// Ejemplo 3: Listar archivos de backup generados
async function example3_ListBackupFiles() {
  log('\n📋 Ejemplo 3: Listar archivos de backup', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      logWarning('Directorio de backups no existe');
      return;
    }
    
    const backupFolders = fs.readdirSync(backupDir)
      .filter(item => fs.statSync(path.join(backupDir, item)).isDirectory())
      .sort()
      .reverse(); // Más recientes primero
    
    if (backupFolders.length === 0) {
      logWarning('No hay backups disponibles');
      return;
    }
    
    logInfo(`Encontrados ${backupFolders.length} backups:`);
    
    backupFolders.forEach((folder, index) => {
      const folderPath = path.join(backupDir, folder);
      const files = fs.readdirSync(folderPath);
      
      log(`\n${index + 1}. ${folder}`, 'yellow');
      log(`   Archivos: ${files.length}`, 'blue');
      
      // Mostrar algunos archivos importantes
      const importantFiles = files.filter(file => 
        file.includes('complete-database.sql') || 
        file.includes('backup-report.md')
      );
      
      if (importantFiles.length > 0) {
        log(`   Importantes: ${importantFiles.join(', ')}`, 'green');
      }
    });
    
  } catch (error) {
    logError(`Error listando backups: ${error.message}`);
  }
}

// Ejemplo 4: Leer reporte de backup
async function example4_ReadBackupReport() {
  log('\n📋 Ejemplo 4: Leer reporte de backup', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      logWarning('Directorio de backups no existe');
      return;
    }
    
    const backupFolders = fs.readdirSync(backupDir)
      .filter(item => fs.statSync(path.join(backupDir, item)).isDirectory())
      .sort()
      .reverse();
    
    if (backupFolders.length === 0) {
      logWarning('No hay backups disponibles');
      return;
    }
    
    const latestBackup = backupFolders[0];
    const reportPath = path.join(backupDir, latestBackup, 'backup-report.md');
    
    if (!fs.existsSync(reportPath)) {
      logWarning('Reporte de backup no encontrado');
      return;
    }
    
    logInfo(`Leyendo reporte del backup más reciente: ${latestBackup}`);
    
    const reportContent = fs.readFileSync(reportPath, 'utf8');
    
    // Extraer información clave del reporte
    const lines = reportContent.split('\n');
    const summaryLine = lines.find(line => line.includes('Total de tablas:'));
    const recordsLine = lines.find(line => line.includes('Total de registros:'));
    const filesLine = lines.find(line => line.includes('Archivos generados:'));
    
    if (summaryLine) log(`📊 ${summaryLine.trim()}`, 'green');
    if (recordsLine) log(`📊 ${recordsLine.trim()}`, 'green');
    if (filesLine) log(`📊 ${filesLine.trim()}`, 'green');
    
  } catch (error) {
    logError(`Error leyendo reporte: ${error.message}`);
  }
}

// Ejemplo 5: Verificar integridad de archivos SQL
async function example5_VerifySQLFiles() {
  log('\n📋 Ejemplo 5: Verificar archivos SQL', 'bright');
  log('=' .repeat(50), 'cyan');
  
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      logWarning('Directorio de backups no existe');
      return;
    }
    
    const backupFolders = fs.readdirSync(backupDir)
      .filter(item => fs.statSync(path.join(backupDir, item)).isDirectory())
      .sort()
      .reverse();
    
    if (backupFolders.length === 0) {
      logWarning('No hay backups disponibles');
      return;
    }
    
    const latestBackup = backupFolders[0];
    const backupPath = path.join(backupDir, latestBackup);
    
    const sqlFiles = fs.readdirSync(backupPath)
      .filter(file => file.endsWith('.sql'));
    
    logInfo(`Verificando ${sqlFiles.length} archivos SQL...`);
    
    sqlFiles.forEach(file => {
      const filePath = path.join(backupPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasCreateTable = content.includes('CREATE TABLE');
      const hasInsertInto = content.includes('INSERT INTO');
      const fileSize = fs.statSync(filePath).size;
      
      log(`\n📄 ${file}`, 'yellow');
      log(`   Tamaño: ${(fileSize / 1024).toFixed(2)} KB`, 'blue');
      log(`   CREATE TABLE: ${hasCreateTable ? '✅' : '❌'}`, hasCreateTable ? 'green' : 'red');
      log(`   INSERT INTO: ${hasInsertInto ? '✅' : '❌'}`, hasInsertInto ? 'green' : 'red');
    });
    
  } catch (error) {
    logError(`Error verificando archivos SQL: ${error.message}`);
  }
}

// Función principal
async function main() {
  log('🚀 Ejemplos de uso del script de backup de Supabase', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    await example1_CheckDependencies();
    await example2_CreateBackup();
    await example3_ListBackupFiles();
    await example4_ReadBackupReport();
    await example5_VerifySQLFiles();
    
    log('\n' + '=' .repeat(60), 'green');
    logSuccess('¡Todos los ejemplos completados!');
    logInfo('Revisa los archivos generados en el directorio backups/');
    
  } catch (error) {
    logError(`Error ejecutando ejemplos: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
