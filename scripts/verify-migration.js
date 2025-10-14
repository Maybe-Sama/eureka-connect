#!/usr/bin/env node

/**
 * Script de Verificación Post-Migración
 * 
 * Este script verifica que una migración no haya causado pérdida de datos
 * comparando el estado antes y después de la migración.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration(backupFile) {
  console.log('🔍 Verificando migración...');

  try {
    // Cargar datos de backup
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    console.log(`📁 Usando backup: ${backupFile}`);
    console.log(`⏰ Fecha del backup: ${backupData.timestamp}`);

    // Obtener datos actuales
    const { data: currentStudents, error: studentsError } = await supabase
      .from('students')
      .select('*');
    
    if (studentsError) throw studentsError;

    const { data: currentClasses, error: classesError } = await supabase
      .from('classes')
      .select('*');
    
    if (classesError) throw classesError;

    const { data: currentCourses, error: coursesError } = await supabase
      .from('courses')
      .select('*');
    
    if (coursesError) throw coursesError;

    // Verificaciones
    const checks = {
      students: {
        before: backupData.students.length,
        after: currentStudents.length,
        status: backupData.students.length === currentStudents.length ? '✅' : '❌'
      },
      classes: {
        before: backupData.classes.length,
        after: currentClasses.length,
        status: backupData.classes.length === currentClasses.length ? '✅' : '❌'
      },
      courses: {
        before: backupData.courses.length,
        after: currentCourses.length,
        status: backupData.courses.length === currentCourses.length ? '✅' : '❌'
      },
      classesPaid: {
        before: backupData.metadata.classes_paid,
        after: currentClasses.filter(c => c.payment_status === 'paid').length,
        status: 'checking'
      }
    };

    // Verificar clases pagadas
    const beforePaid = backupData.metadata.classes_paid;
    const afterPaid = currentClasses.filter(c => c.payment_status === 'paid').length;
    checks.classesPaid.status = beforePaid === afterPaid ? '✅' : '❌';

    // Mostrar resultados
    console.log('\n📊 RESULTADOS DE VERIFICACIÓN:');
    console.log('================================');
    
    Object.entries(checks).forEach(([key, check]) => {
      console.log(`${check.status} ${key}: ${check.before} → ${check.after}`);
    });

    // Verificar integridad de datos críticos
    const criticalIssues = [];
    
    if (checks.students.status === '❌') {
      criticalIssues.push('❌ Pérdida de estudiantes');
    }
    
    if (checks.classes.status === '❌') {
      criticalIssues.push('❌ Pérdida de clases');
    }
    
    if (checks.classesPaid.status === '❌') {
      criticalIssues.push('❌ Pérdida de estado de pagos');
    }

    if (criticalIssues.length > 0) {
      console.log('\n🚨 PROBLEMAS CRÍTICOS DETECTADOS:');
      criticalIssues.forEach(issue => console.log(`   ${issue}`));
      console.log('\n💡 Recomendación: Restaurar desde backup');
      return false;
    } else {
      console.log('\n✅ Migración verificada exitosamente');
      return true;
    }

  } catch (error) {
    console.error('❌ Error verificando migración:', error);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error('❌ Uso: node verify-migration.js <backup-file>');
    process.exit(1);
  }
  verifyMigration(backupFile);
}

module.exports = { verifyMigration };
