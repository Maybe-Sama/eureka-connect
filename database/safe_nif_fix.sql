-- Script SEGURO para solucionar el problema de NIF
-- Ejecutar en Supabase SQL Editor paso a paso

-- PASO 1: Crear respaldo de restricciones
CREATE TABLE IF NOT EXISTS constraint_backup_$(date +%Y%m%d) AS
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition,
    contype as constraint_type,
    now() as backup_date
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c';

-- PASO 2: Ver restricciones actuales
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c'
ORDER BY conname;

-- PASO 3: Eliminar solo la restricción problemática de NIF
-- (Ejecutar solo si existe chk_nif_format)
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS chk_nif_format;

-- PASO 4: Verificar que se eliminó
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c'
AND conname LIKE '%nif%';

-- PASO 5: Probar que funciona (opcional)
-- UPDATE public.students 
-- SET nif = 'B13998539' 
-- WHERE id = 79;

-- PASO 6: Verificar resultado (opcional)
-- SELECT id, first_name, last_name, dni, nif FROM public.students WHERE id = 79;

