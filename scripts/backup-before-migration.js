#!/usr/bin/env node

/**
 * Script de Backup Automático antes de Migraciones
 * 
 * Este script debe ejecutarse ANTES de cualquier migración crítica
 * para crear un backup de seguridad de los datos importantes.
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

async function createBackup() {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const backupDir = path.join(__dirname, '..', 'database', 'backups');
  
  // Crear directorio de backups si no existe
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log('🔄 Creando backup de seguridad...');

  try {
    // Backup de estudiantes
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('*');
    
    if (studentsError) throw studentsError;
    
    // Backup de clases
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select('*');
    
    if (classesError) throw classesError;
    
    // Backup de cursos
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*');
    
    if (coursesError) throw coursesError;

    // Crear archivo de backup
    const backupData = {
      timestamp,
      students,
      classes,
      courses,
      metadata: {
        total_students: students.length,
        total_classes: classes.length,
        total_courses: courses.length,
        classes_with_payment_status: classes.filter(c => c.payment_status).length,
        classes_paid: classes.filter(c => c.payment_status === 'paid').length,
        classes_unpaid: classes.filter(c => c.payment_status === 'unpaid').length
      }
    };

    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log('✅ Backup creado exitosamente:');
    console.log(`   📁 Archivo: ${backupFile}`);
    console.log(`   👥 Estudiantes: ${students.length}`);
    console.log(`   📚 Clases: ${classes.length}`);
    console.log(`   🎓 Cursos: ${courses.length}`);
    console.log(`   💰 Clases pagadas: ${backupData.metadata.classes_paid}`);
    console.log(`   ⏳ Clases pendientes: ${backupData.metadata.classes_unpaid}`);

    return backupFile;

  } catch (error) {
    console.error('❌ Error creando backup:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
