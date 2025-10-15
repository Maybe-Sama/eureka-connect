#!/usr/bin/env node

/**
 * Script para verificar que el build funciona correctamente
 * Ejecuta: node scripts/check-build.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Configuración de colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function checkBuild() {
  log('🔍 Verificando build de la aplicación...', 'blue')
  log('', 'reset')
  
  try {
    // Verificar que estamos en el directorio correcto
    if (!fs.existsSync('package.json')) {
      log('❌ No se encontró package.json. Ejecuta este script desde la raíz del proyecto.', 'red')
      process.exit(1)
    }
    
    // Verificar que pnpm está instalado
    try {
      execSync('pnpm --version', { stdio: 'pipe' })
    } catch {
      log('❌ pnpm no está instalado. Instálalo con: npm install -g pnpm', 'red')
      process.exit(1)
    }
    
    // Limpiar build anterior
    log('🧹 Limpiando build anterior...', 'yellow')
    try {
      if (fs.existsSync('.next')) {
        execSync('rm -rf .next', { stdio: 'pipe' })
      }
    } catch {
      // En Windows, usar rmdir
      try {
        execSync('rmdir /s /q .next', { stdio: 'pipe' })
      } catch {
        // Ignorar si no existe
      }
    }
    
    // Ejecutar linting
    log('🔍 Ejecutando ESLint...', 'cyan')
    try {
      execSync('pnpm lint', { stdio: 'pipe' })
      log('✅ ESLint pasó sin errores', 'green')
    } catch (error) {
      log('❌ ESLint encontró errores:', 'red')
      console.log(error.stdout?.toString() || error.message)
      process.exit(1)
    }
    
    // Ejecutar build
    log('🏗️  Ejecutando build...', 'cyan')
    try {
      execSync('pnpm build', { stdio: 'pipe' })
      log('✅ Build completado exitosamente', 'green')
    } catch (error) {
      log('❌ Build falló:', 'red')
      console.log(error.stdout?.toString() || error.message)
      process.exit(1)
    }
    
    // Verificar que se generaron los archivos necesarios
    log('🔍 Verificando archivos generados...', 'cyan')
    const requiredFiles = [
      '.next/static',
      '.next/server',
      '.next/BUILD_ID'
    ]
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        log(`❌ Archivo requerido no encontrado: ${file}`, 'red')
        process.exit(1)
      }
    }
    
    log('✅ Todos los archivos requeridos están presentes', 'green')
    
    // Verificar tamaño del build
    const buildSize = getDirectorySize('.next')
    log(`📊 Tamaño del build: ${formatBytes(buildSize)}`, 'blue')
    
    // Verificar que no hay archivos problemáticos
    log('🔍 Verificando archivos problemáticos...', 'cyan')
    const problematicFiles = findProblematicFiles('.next')
    if (problematicFiles.length > 0) {
      log('⚠️  Archivos problemáticos encontrados:', 'yellow')
      problematicFiles.forEach(file => log(`  - ${file}`, 'yellow'))
    } else {
      log('✅ No se encontraron archivos problemáticos', 'green')
    }
    
    log('', 'reset')
    log('🎉 ¡Verificación de build completada exitosamente!', 'green')
    log('', 'reset')
    log('Próximos pasos:', 'blue')
    log('1. Haz commit de los cambios', 'cyan')
    log('2. Haz push a tu repositorio', 'cyan')
    log('3. Vercel desplegará automáticamente', 'cyan')
    
  } catch (error) {
    log(`💥 Error inesperado: ${error.message}`, 'red')
    process.exit(1)
  }
}

function getDirectorySize(dirPath) {
  let totalSize = 0
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath)
    if (stats.isDirectory()) {
      const files = fs.readdirSync(itemPath)
      files.forEach(file => {
        calculateSize(path.join(itemPath, file))
      })
    } else {
      totalSize += stats.size
    }
  }
  
  try {
    calculateSize(dirPath)
  } catch {
    // Ignorar errores de acceso
  }
  
  return totalSize
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function findProblematicFiles(dirPath) {
  const problematic = []
  
  function checkDirectory(currentPath) {
    try {
      const items = fs.readdirSync(currentPath)
      items.forEach(item => {
        const itemPath = path.join(currentPath, item)
        const stats = fs.statSync(itemPath)
        
        if (stats.isDirectory()) {
          checkDirectory(itemPath)
        } else {
          // Verificar archivos muy grandes (> 1MB)
          if (stats.size > 1024 * 1024) {
            problematic.push(`${itemPath} (${formatBytes(stats.size)})`)
          }
          
          // Verificar archivos con extensiones problemáticas
          const ext = path.extname(item).toLowerCase()
          if (['.map', '.log', '.tmp'].includes(ext)) {
            problematic.push(itemPath)
          }
        }
      })
    } catch {
      // Ignorar errores de acceso
    }
  }
  
  checkDirectory(dirPath)
  return problematic
}

// Ejecutar verificación
if (require.main === module) {
  checkBuild()
}

module.exports = { checkBuild }

