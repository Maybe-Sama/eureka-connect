-- Script completo para solucionar el problema de NIF
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las restricciones actuales
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c';

-- 2. Eliminar restricciones problemáticas de NIF
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS chk_nif_format;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS chk_dni_format;

-- 3. Verificar que se eliminaron
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c';

-- 4. Probar insertar un NIF de empresa para verificar
-- (Comentar estas líneas después de verificar)
-- UPDATE public.students 
-- SET nif = 'B13998539' 
-- WHERE id = 79;

-- 5. Verificar que el NIF se guardó correctamente
-- SELECT id, first_name, last_name, dni, nif FROM public.students WHERE id = 79;

