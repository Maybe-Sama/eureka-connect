#!/usr/bin/env node

/**
 * Script de prueba para verificar que las dependencias del backup estén disponibles
 * Ejecutar antes del backup principal para detectar problemas
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

// Verificar dependencias de Node.js
function checkNodeDependencies() {
  log('🔍 Verificando dependencias de Node.js...', 'bright');
  
  const requiredModules = ['fs', 'path', 'util'];
  let allGood = true;
  
  requiredModules.forEach(moduleName => {
    try {
      require(moduleName);
      logSuccess(`Módulo ${moduleName} disponible`);
    } catch (error) {
      logError(`Módulo ${moduleName} no disponible: ${error.message}`);
      allGood = false;
    }
  });
  
  return allGood;
}

// Verificar dependencias de npm
function checkNpmDependencies() {
  log('\n🔍 Verificando dependencias de npm...', 'bright');
  
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    logError('package.json no encontrado');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['@supabase/supabase-js'];
  let allGood = true;
  
  requiredDeps.forEach(dep => {
    if (dependencies[dep]) {
      logSuccess(`Dependencia ${dep} encontrada (${dependencies[dep]})`);
    } else {
      logError(`Dependencia ${dep} no encontrada`);
      allGood = false;
    }
  });
  
  return allGood;
}

// Verificar variables de entorno
function checkEnvironmentVariables() {
  log('\n🔍 Verificando variables de entorno...', 'bright');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const optionalVars = [
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  let allGood = true;
  
  // Verificar variables requeridas
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      logSuccess(`Variable ${varName} configurada`);
    } else {
      logError(`Variable ${varName} no configurada`);
      allGood = false;
    }
  });
  
  // Verificar variables opcionales
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      logSuccess(`Variable ${varName} configurada (opcional)`);
    } else {
      logWarning(`Variable ${varName} no configurada (opcional)`);
    }
  });
  
  return allGood;
}

// Verificar archivo .env.local
function checkEnvFile() {
  log('\n🔍 Verificando archivo .env.local...', 'bright');
  
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (fs.existsSync(envPath)) {
    logSuccess('Archivo .env.local encontrado');
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL');
    const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    if (hasSupabaseUrl && hasSupabaseKey) {
      logSuccess('Variables de Supabase encontradas en .env.local');
      return true;
    } else {
      logWarning('Variables de Supabase no encontradas en .env.local');
      return false;
    }
  } else {
    logWarning('Archivo .env.local no encontrado');
    return false;
  }
}

// Verificar directorio de backups
function checkBackupDirectory() {
  log('\n🔍 Verificando directorio de backups...', 'bright');
  
  const backupDir = path.join(__dirname, '..', 'backups');
  
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      logSuccess('Directorio de backups creado');
    } else {
      logSuccess('Directorio de backups existe');
    }
    
    // Verificar permisos de escritura
    const testFile = path.join(backupDir, 'test-write.tmp');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    logSuccess('Permisos de escritura verificados');
    
    return true;
  } catch (error) {
    logError(`Error con directorio de backups: ${error.message}`);
    return false;
  }
}

// Probar conexión a Supabase
async function testSupabaseConnection() {
  log('\n🔍 Probando conexión a Supabase...', 'bright');
  
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      logError('Variables de Supabase no configuradas');
      return false;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Probar una consulta simple - usar una tabla que sabemos que existe
    const { data, error } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (error) {
      logError(`Error de conexión a Supabase: ${error.message}`);
      return false;
    }
    
    logSuccess('Conexión a Supabase exitosa');
    return true;
    
  } catch (error) {
    logError(`Error probando conexión: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  log('🧪 Iniciando verificación de dependencias del backup...', 'bright');
  log('=' .repeat(60), 'cyan');
  
  const checks = [
    { name: 'Dependencias de Node.js', fn: checkNodeDependencies },
    { name: 'Dependencias de npm', fn: checkNpmDependencies },
    { name: 'Variables de entorno', fn: checkEnvironmentVariables },
    { name: 'Archivo .env.local', fn: checkEnvFile },
    { name: 'Directorio de backups', fn: checkBackupDirectory },
    { name: 'Conexión a Supabase', fn: testSupabaseConnection }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      if (!result) {
        allPassed = false;
      }
    } catch (error) {
      logError(`Error en ${check.name}: ${error.message}`);
      allPassed = false;
    }
  }
  
  log('\n' + '=' .repeat(60), allPassed ? 'green' : 'red');
  
  if (allPassed) {
    logSuccess('¡Todas las verificaciones pasaron! El script de backup debería funcionar correctamente.');
    logInfo('Puedes ejecutar: pnpm run backup-database');
  } else {
    logError('Algunas verificaciones fallaron. Revisa los errores arriba antes de ejecutar el backup.');
  }
  
  log('=' .repeat(60), allPassed ? 'green' : 'red');
  
  process.exit(allPassed ? 0 : 1);
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
