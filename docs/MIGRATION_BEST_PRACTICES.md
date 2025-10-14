# Mejores Prácticas para Migraciones de Base de Datos

## 🚨 REGLAS CRÍTICAS

### 1. **NUNCA sobrescribir datos existentes sin verificación**
```sql
-- ❌ MALO: Sobrescribe todos los valores
UPDATE classes SET payment_status = 'unpaid' WHERE payment_status IS NULL;

-- ✅ BUENO: Solo actualiza valores realmente NULL
UPDATE classes SET payment_status = 'unpaid' 
WHERE payment_status IS NULL 
AND id NOT IN (SELECT id FROM classes WHERE payment_status IS NOT NULL);
```

### 2. **Siempre hacer backup antes de migraciones**
```sql
-- ✅ Crear tabla de respaldo
CREATE TABLE classes_backup_YYYYMMDD AS SELECT * FROM classes;
```

### 3. **Usar transacciones para migraciones críticas**
```sql
-- ✅ Envolver en transacción
BEGIN;
-- ... migración ...
-- Verificar resultados
-- Si todo OK: COMMIT;
-- Si hay problemas: ROLLBACK;
```

### 4. **Verificar datos antes y después**
```sql
-- Antes de la migración
SELECT COUNT(*) as total, 
       COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
       COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid
FROM classes;

-- Después de la migración
-- Verificar que los números coincidan
```

## 📋 CHECKLIST DE MIGRACIÓN

### Antes de ejecutar:
- [ ] ✅ Backup completo de la base de datos
- [ ] ✅ Verificar datos existentes
- [ ] ✅ Probar en entorno de desarrollo
- [ ] ✅ Documentar cambios esperados
- [ ] ✅ Preparar script de rollback

### Durante la migración:
- [ ] ✅ Usar transacciones
- [ ] ✅ Ejecutar en horario de bajo tráfico
- [ ] ✅ Monitorear logs de error
- [ ] ✅ Verificar cada paso

### Después de la migración:
- [ ] ✅ Verificar integridad de datos
- [ ] ✅ Comparar conteos antes/después
- [ ] ✅ Probar funcionalidad crítica
- [ ] ✅ Documentar resultados

## 🔧 MIGRACIÓN CORREGIDA

```sql
-- ✅ VERSIÓN SEGURA de add-payment-fields-classes.sql

-- 1. Crear backup
CREATE TABLE classes_backup_20241013 AS SELECT * FROM classes;

-- 2. Agregar columnas con valores por defecto
ALTER TABLE classes ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE classes ADD COLUMN payment_notes TEXT DEFAULT '';
ALTER TABLE classes ADD COLUMN payment_date TEXT DEFAULT NULL;

-- 3. SOLO actualizar registros que realmente necesitan valores por defecto
-- (No tocar registros que ya tienen valores)
UPDATE classes 
SET payment_status = 'unpaid' 
WHERE payment_status IS NULL 
AND created_at < '2024-10-13'; -- Solo clases creadas antes de la migración

-- 4. Verificar que no se perdieron datos
SELECT 
    COUNT(*) as total_classes,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_classes,
    COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_classes
FROM classes;

-- 5. Si algo salió mal, restaurar desde backup
-- DROP TABLE classes;
-- ALTER TABLE classes_backup_20241013 RENAME TO classes;
```

## 🚨 SEÑALES DE ALERTA

### Red flags en migraciones:
- ❌ `UPDATE table SET field = 'value' WHERE field IS NULL` (sin verificación adicional)
- ❌ Migraciones sin backup
- ❌ Cambios masivos sin transacciones
- ❌ Sin verificación post-migración
- ❌ Sin script de rollback

### Green flags:
- ✅ Backup automático
- ✅ Verificación de datos existentes
- ✅ Transacciones con rollback
- ✅ Pruebas en desarrollo
- ✅ Documentación completa
