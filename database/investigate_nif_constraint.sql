-- Script para investigar las restricciones de NIF en la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las restricciones CHECK en la tabla students
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.students'::regclass 
AND contype = 'c';

-- 2. Ver la estructura de la tabla students
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Ver datos existentes en los campos dni y nif
SELECT 
    id,
    first_name,
    last_name,
    dni,
    nif,
    CASE 
        WHEN dni IS NOT NULL THEN 'DNI'
        WHEN nif IS NOT NULL THEN 'NIF'
        ELSE 'NONE'
    END as document_type
FROM students 
WHERE dni IS NOT NULL OR nif IS NOT NULL
LIMIT 10;

