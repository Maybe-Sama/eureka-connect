-- Script para verificar que la solución funciona
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que no hay restricciones problemáticas
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c'
AND (conname LIKE '%nif%' OR conname LIKE '%dni%');

-- 2. Ver la estructura de los campos dni y nif
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
AND column_name IN ('dni', 'nif');

-- 3. Probar diferentes formatos de NIF
-- (Descomentar para probar)
-- UPDATE public.students 
-- SET nif = 'B13998539' 
-- WHERE id = 79;

-- 4. Verificar que se guardó correctamente
-- SELECT id, first_name, last_name, dni, nif FROM public.students WHERE id = 79;

