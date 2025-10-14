-- Script de respaldo de restricciones
-- Ejecutar ANTES de eliminar las restricciones

-- 1. Crear respaldo de las restricciones actuales
CREATE TABLE IF NOT EXISTS constraint_backup AS
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c';

-- 2. Ver el respaldo
SELECT * FROM constraint_backup;

-- 3. Si necesitas restaurar una restricción, usa:
-- ALTER TABLE public.students ADD CONSTRAINT nombre_constraint CHECK (condicion);

