-- ============================================================================
-- EXAMS TABLE SCHEMA - SAFE VERSION
-- ============================================================================
-- Este script crea la tabla de exámenes verificando la existencia de elementos
-- Evita errores de "already exists"
-- ============================================================================

-- Crear tabla de exámenes (solo si no existe)
CREATE TABLE IF NOT EXISTS public.exams (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME,
    notes TEXT,
    grade DECIMAL(4,2) CHECK (grade >= 0 AND grade <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices solo si no existen
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exams_student_id') THEN
        CREATE INDEX idx_exams_student_id ON public.exams(student_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exams_date') THEN
        CREATE INDEX idx_exams_date ON public.exams(exam_date);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_exams_student_date') THEN
        CREATE INDEX idx_exams_student_date ON public.exams(student_id, exam_date);
    END IF;
END $$;

-- Crear función solo si no existe
CREATE OR REPLACE FUNCTION public.update_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger solo si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_exams_updated_at'
    ) THEN
        CREATE TRIGGER trigger_update_exams_updated_at
            BEFORE UPDATE ON public.exams
            FOR EACH ROW
            EXECUTE FUNCTION public.update_exams_updated_at();
    END IF;
END $$;

-- Habilitar RLS solo si no está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'exams' 
        AND n.nspname = 'public'
        AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.exams;
DROP POLICY IF EXISTS "Allow select for anonymous users" ON public.exams;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.exams;

-- Crear políticas RLS más permisivas
CREATE POLICY "Allow all operations for service role" ON public.exams
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.exams
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow select for anonymous users" ON public.exams
    FOR SELECT
    TO anon
    USING (true);

-- Otorgar permisos (estos son seguros de ejecutar múltiples veces)
GRANT ALL ON public.exams TO service_role;
GRANT ALL ON public.exams TO authenticated;
GRANT SELECT ON public.exams TO anon;

-- Otorgar permisos en secuencias (verificar que existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'exams_id_seq') THEN
        GRANT USAGE, SELECT ON SEQUENCE exams_id_seq TO service_role;
        GRANT USAGE, SELECT ON SEQUENCE exams_id_seq TO authenticated;
    END IF;
END $$;

-- Comentarios en la tabla
COMMENT ON TABLE public.exams IS 'Tabla de exámenes de estudiantes';
COMMENT ON COLUMN public.exams.student_id IS 'ID del estudiante propietario del examen';
COMMENT ON COLUMN public.exams.subject IS 'Asignatura del examen';
COMMENT ON COLUMN public.exams.exam_date IS 'Fecha del examen';
COMMENT ON COLUMN public.exams.exam_time IS 'Hora del examen (opcional)';
COMMENT ON COLUMN public.exams.notes IS 'Notas adicionales del examen';
COMMENT ON COLUMN public.exams.grade IS 'Nota del examen (0-10)';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'EXAMS TABLE SETUP COMPLETED SAFELY';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Status:';
    RAISE NOTICE '  - Table: exams (created or verified)';
    RAISE NOTICE '  - Indexes: created or verified';
    RAISE NOTICE '  - Trigger: created or verified';
    RAISE NOTICE '  - RLS: enabled or verified';
    RAISE NOTICE '  - Policies: created or updated';
    RAISE NOTICE '  - Permissions: granted';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Test the API endpoints';
    RAISE NOTICE '  2. Create some test exams';
    RAISE NOTICE '  3. Verify the calendar integration';
    RAISE NOTICE '============================================================================';
END $$;
