-- ============================================================================
-- DISABLE RLS FOR EXAMS TABLE
-- ============================================================================
-- Este script deshabilita RLS en la tabla de exámenes para permitir
-- operaciones desde el sistema de autenticación personalizado
-- ============================================================================

-- Deshabilitar RLS en la tabla de exámenes
ALTER TABLE public.exams DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'exams' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = false
    ) THEN
        RAISE NOTICE '✅ RLS deshabilitado correctamente en la tabla exams';
    ELSE
        RAISE NOTICE '❌ RLS aún está habilitado en la tabla exams';
    END IF;
END $$;

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RLS DISABLED FOR EXAMS TABLE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Status:';
    RAISE NOTICE '  - RLS disabled on exams table';
    RAISE NOTICE '  - All operations now allowed for service_role';
    RAISE NOTICE '  - Security handled at application level';
    RAISE NOTICE '';
    RAISE NOTICE 'Note: Security is now handled by your custom authentication system';
    RAISE NOTICE '============================================================================';
END $$;

















