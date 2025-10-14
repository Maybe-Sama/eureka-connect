-- Solución simple para el problema de NIF
-- Ejecutar en Supabase SQL Editor

-- Eliminar la restricción que está causando el error
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS chk_nif_format;

-- Verificar que se eliminó
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c'
AND conname LIKE '%nif%';

