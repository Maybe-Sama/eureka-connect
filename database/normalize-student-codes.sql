-- ============================================================================
-- Script: Normalizar códigos de estudiante (quitar guiones)
-- ============================================================================
-- Este script actualiza todos los códigos de estudiante para quitar guiones
-- y actualiza el RPC para que acepte códigos con o sin guiones
-- ============================================================================

-- Paso 1: Actualizar todos los códigos existentes (quitar guiones)
-- ============================================================================

UPDATE public.students
SET student_code = UPPER(REPLACE(REPLACE(student_code, '-', ''), ' ', ''))
WHERE student_code LIKE '%-%' OR student_code LIKE '% %';

-- Verificar los códigos actualizados
SELECT 
    id,
    student_code,
    first_name,
    last_name
FROM public.students
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- Paso 2: Actualizar la función RPC para normalizar códigos automáticamente
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_student_user(
    student_code TEXT,
    student_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_record RECORD;
    user_id UUID;
    normalized_code TEXT;
BEGIN
    -- Normalizar el código (quitar guiones y espacios)
    normalized_code := UPPER(REPLACE(REPLACE(student_code, '-', ''), ' ', ''));
    
    -- Get student by normalized code
    SELECT id, email, first_name, last_name INTO student_record
    FROM public.students
    WHERE students.student_code = normalized_code;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found with code: %', normalized_code;
    END IF;
    
    -- Check if user already exists
    SELECT id INTO user_id
    FROM public.system_users
    WHERE student_id = student_record.id;
    
    IF FOUND THEN
        RAISE EXCEPTION 'User already exists for this student';
    END IF;
    
    -- Create system user
    INSERT INTO public.system_users (email, password_hash, user_type, student_id)
    VALUES (
        student_record.email,
        student_password,
        'student',
        student_record.id
    )
    RETURNING id INTO user_id;
    
    RETURN user_id;
END;
$$;

-- ============================================================================
-- Verificación Final
-- ============================================================================

SELECT 
    'Total de códigos con guiones' as check_name,
    COUNT(*) as count
FROM public.students
WHERE student_code LIKE '%-%';

-- Debería mostrar 0

SELECT 
    'Total de estudiantes' as check_name,
    COUNT(*) as count
FROM public.students;

-- Verificar que la función existe
SELECT 
    p.proname as function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid) as parameters
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_student_user';

-- ============================================================================
-- INSTRUCCIONES
-- ============================================================================
-- 1. Copia TODO este script
-- 2. Pégalo en el SQL Editor de Supabase
-- 3. Click en "Run" (Ctrl+Enter)
-- 4. Verifica que:
--    - Los códigos ya no tienen guiones
--    - La función create_student_user está actualizada
-- ============================================================================

