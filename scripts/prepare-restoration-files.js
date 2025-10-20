#!/usr/bin/env node

/**
 * Script para preparar archivos de restauración para Supabase SQL Editor
 * Genera archivos SQL optimizados para restauración manual
 */

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

// Crear archivo de restauración optimizado
function createOptimizedRestorationFile(backupPath) {
  const outputDir = path.join(backupPath, 'restoration');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Leer archivos existentes
  const completeSQL = fs.readFileSync(path.join(backupPath, 'complete-database.sql'), 'utf8');
  const schemaSQL = fs.readFileSync(path.join(backupPath, 'schema-only.sql'), 'utf8');
  const dataSQL = fs.readFileSync(path.join(backupPath, 'data-only.sql'), 'utf8');
  
  // Crear archivo de restauración paso a paso
  const stepByStepSQL = `-- ============================================================
-- RESTAURACIÓN PASO A PASO PARA SUPABASE SQL EDITOR
-- ============================================================
-- Este archivo contiene instrucciones para restaurar tu backup
-- en una nueva base de datos de Supabase
-- ============================================================

-- PASO 1: Crear todas las tablas
-- Copia y ejecuta el contenido del archivo 'schema-only.sql'
-- ============================================================

-- PASO 2: Insertar todos los datos
-- Copia y ejecuta el contenido del archivo 'data-only.sql'
-- ============================================================

-- PASO 3: Verificar restauración
-- Ejecuta las siguientes consultas para verificar:

-- Verificar tablas creadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Contar registros por tabla
SELECT 
  'courses' as tabla, COUNT(*) as registros FROM courses
UNION ALL
SELECT 
  'students' as tabla, COUNT(*) as registros FROM students
UNION ALL
SELECT 
  'classes' as tabla, COUNT(*) as registros FROM classes
UNION ALL
SELECT 
  'invoices' as tabla, COUNT(*) as registros FROM invoices
UNION ALL
SELECT 
  'class_tracking' as tabla, COUNT(*) as registros FROM class_tracking
UNION ALL
SELECT 
  'exams' as tabla, COUNT(*) as registros FROM exams
UNION ALL
SELECT 
  'monthly_reports' as tabla, COUNT(*) as registros FROM monthly_reports
UNION ALL
SELECT 
  'student_preferences' as tabla, COUNT(*) as registros FROM student_preferences
UNION ALL
SELECT 
  'system_users' as tabla, COUNT(*) as registros FROM system_users
UNION ALL
SELECT 
  'user_sessions' as tabla, COUNT(*) as registros FROM user_sessions
UNION ALL
SELECT 
  'configuracion_fiscal' as tabla, COUNT(*) as registros FROM configuracion_fiscal
UNION ALL
SELECT 
  'eventos_rrsif' as tabla, COUNT(*) as registros FROM eventos_rrsif
UNION ALL
SELECT 
  'facturas_rrsif' as tabla, COUNT(*) as registros FROM facturas_rrsif;

-- ============================================================
-- INSTRUCCIONES COMPLETAS:
-- ============================================================
-- 1. Ve a tu proyecto de Supabase
-- 2. Abre el SQL Editor
-- 3. Ejecuta primero: schema-only.sql
-- 4. Luego ejecuta: data-only.sql
-- 5. Finalmente ejecuta las consultas de verificación arriba
-- ============================================================`;

  // Guardar archivo de instrucciones
  fs.writeFileSync(path.join(outputDir, 'RESTAURACION_INSTRUCCIONES.sql'), stepByStepSQL);
  
  // Copiar archivos necesarios
  fs.writeFileSync(path.join(outputDir, '1-schema-only.sql'), schemaSQL);
  fs.writeFileSync(path.join(outputDir, '2-data-only.sql'), dataSQL);
  fs.writeFileSync(path.join(outputDir, '3-verificacion.sql'), stepByStepSQL);
  
  // Crear archivo README
  const readme = `# 📋 Instrucciones de Restauración

## Archivos Generados

- \`RESTAURACION_INSTRUCCIONES.sql\` - Instrucciones completas paso a paso
- \`1-schema-only.sql\` - Solo estructura de tablas (ejecutar primero)
- \`2-data-only.sql\` - Solo datos (ejecutar segundo)
- \`3-verificacion.sql\` - Consultas de verificación (ejecutar al final)

## Pasos para Restaurar

### 1. Preparar Base de Datos de Test
- Crear nuevo proyecto en Supabase
- Obtener credenciales del proyecto

### 2. Ejecutar en SQL Editor
1. Abrir SQL Editor en tu proyecto de test
2. Ejecutar \`1-schema-only.sql\` (crear tablas)
3. Ejecutar \`2-data-only.sql\` (insertar datos)
4. Ejecutar \`3-verificacion.sql\` (verificar restauración)

### 3. Verificar Resultados
- Revisar que todas las tablas se crearon
- Verificar que los datos se insertaron correctamente
- Comprobar que las relaciones funcionan

## Archivos de Respaldo Originales

Los archivos originales del backup están en el directorio padre:
- \`complete-database.sql\` - Script completo
- \`backup-report.md\` - Reporte detallado del backup
- Archivos individuales por tabla (.sql y .json)

## Notas Importantes

- Asegúrate de usar un proyecto de TEST, no producción
- Verifica las credenciales antes de ejecutar
- Revisa los permisos de las tablas después de la restauración
- Considera configurar RLS (Row Level Security) si es necesario
`;

  fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  
  return outputDir;
}

// Función principal
async function main() {
  log('🚀 Preparando archivos de restauración...', 'bright');
  log('=' .repeat(60), 'cyan');
  
  try {
    // 1. Encontrar backup más reciente
    const backupPath = findLatestBackup();
    if (!backupPath) {
      process.exit(1);
    }
    
    // 2. Crear archivos de restauración optimizados
    const restorationDir = createOptimizedRestorationFile(backupPath);
    
    // 3. Mostrar resumen
    log('\n' + '=' .repeat(60), 'green');
    logSuccess('¡Archivos de restauración preparados!');
    logInfo(`Directorio: ${restorationDir}`);
    logInfo('Archivos generados:');
    logInfo('  - RESTAURACION_INSTRUCCIONES.sql');
    logInfo('  - 1-schema-only.sql');
    logInfo('  - 2-data-only.sql');
    logInfo('  - 3-verificacion.sql');
    logInfo('  - README.md');
    
    log('\n📋 Próximos pasos:', 'bright');
    log('1. Ve a tu proyecto de Supabase de test', 'blue');
    log('2. Abre el SQL Editor', 'blue');
    log('3. Sigue las instrucciones en RESTAURACION_INSTRUCCIONES.sql', 'blue');
    
    log('=' .repeat(60), 'green');
    
  } catch (error) {
    logError(`Error preparando archivos: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
