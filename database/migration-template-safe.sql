-- ========================================
-- TEMPLATE DE MIGRACIÓN SEGURA
-- ========================================
-- Usar este template para todas las migraciones futuras
-- Reemplazar [MIGRATION_NAME] con el nombre de la migración

-- ========================================
-- PASO 1: BACKUP AUTOMÁTICO
-- ========================================
-- Ejecutar ANTES de esta migración:
-- node scripts/backup-before-migration.js

-- ========================================
-- PASO 2: VERIFICACIÓN PRE-MIGRACIÓN
-- ========================================
-- Documentar el estado actual
SELECT 
    'PRE-MIGRATION' as phase,
    COUNT(*) as total_classes,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_classes,
    COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_classes,
    COUNT(CASE WHEN payment_status IS NULL THEN 1 END) as null_payment_status
FROM classes;

-- ========================================
-- PASO 3: MIGRACIÓN CON TRANSACCIÓN
-- ========================================
BEGIN;

-- Agregar nuevas columnas (si es necesario)
-- ALTER TABLE classes ADD COLUMN new_field TEXT DEFAULT 'default_value';

-- Actualizar datos existentes de forma SEGURA
-- Solo actualizar registros que realmente necesitan el cambio
-- UPDATE classes 
-- SET payment_status = 'unpaid' 
-- WHERE payment_status IS NULL 
-- AND created_at < '2024-10-13'; -- Solo clases creadas antes de la migración

-- ========================================
-- PASO 4: VERIFICACIÓN POST-MIGRACIÓN
-- ========================================
-- Verificar que no se perdieron datos
SELECT 
    'POST-MIGRATION' as phase,
    COUNT(*) as total_classes,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_classes,
    COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_classes,
    COUNT(CASE WHEN payment_status IS NULL THEN 1 END) as null_payment_status
FROM classes;

-- ========================================
-- PASO 5: DECISIÓN FINAL
-- ========================================
-- Si todo está correcto:
-- COMMIT;

-- Si hay problemas:
-- ROLLBACK;

-- ========================================
-- PASO 6: VERIFICACIÓN FINAL
-- ========================================
-- Ejecutar DESPUÉS de la migración:
-- node scripts/verify-migration.js database/backups/backup_YYYY-MM-DDTHH-MM-SS.json

-- ========================================
-- NOTAS DE LA MIGRACIÓN
-- ========================================
-- Fecha: [FECHA]
-- Autor: [AUTOR]
-- Descripción: [DESCRIPCIÓN]
-- Tablas afectadas: [TABLAS]
-- Campos agregados: [CAMPOS]
-- Campos modificados: [CAMPOS]
-- Datos críticos preservados: [SÍ/NO]
-- Backup creado: [SÍ/NO]
-- Verificación completada: [SÍ/NO]
