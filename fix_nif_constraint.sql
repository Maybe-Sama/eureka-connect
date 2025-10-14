-- Script para solucionar la restricción de NIF
-- Ejecutar en Supabase SQL Editor

-- 1. Primero, verificar qué restricciones existen
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c'
AND conname LIKE '%nif%';

-- 2. Eliminar la restricción chk_nif_format si existe
-- (Comentar esta línea si no existe la restricción)
-- ALTER TABLE public.students DROP CONSTRAINT IF EXISTS chk_nif_format;

-- 3. Verificar que se eliminó correctamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c';

