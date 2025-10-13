-- ============================================================================
-- EXAMS TABLE SCHEMA - SIMPLE VERSION
-- ============================================================================
-- Este script crea la tabla de exámenes sin RLS complejo
-- Basado en el sistema de autenticación personalizado del proyecto
-- ============================================================================

-- Crear tabla de exámenes
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

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_exams_student_id ON public.exams(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON public.exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_exams_student_date ON public.exams(student_id, exam_date);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_exams_updated_at();

-- Habilitar RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simples - permitir todo a usuarios autenticados
-- (La seguridad se maneja a nivel de aplicación)
CREATE POLICY "Allow all operations for authenticated users" ON public.exams
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Políticas para usuarios anónimos (si es necesario)
CREATE POLICY "Allow select for anonymous users" ON public.exams
    FOR SELECT
    TO anon
    USING (true);

-- Otorgar permisos
GRANT ALL ON public.exams TO service_role;
GRANT ALL ON public.exams TO authenticated;
GRANT SELECT ON public.exams TO anon;

-- Otorgar permisos en secuencias
GRANT USAGE, SELECT ON SEQUENCE exams_id_seq TO service_role;
GRANT USAGE, SELECT ON SEQUENCE exams_id_seq TO authenticated;

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
    RAISE NOTICE 'EXAMS TABLE CREATED SUCCESSFULLY';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - exams table with all required columns';
    RAISE NOTICE '  - indexes for performance optimization';
    RAISE NOTICE '  - trigger for updated_at timestamp';
    RAISE NOTICE '  - RLS policies for security';
    RAISE NOTICE '  - grants for service_role and authenticated users';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Test the API endpoints';
    RAISE NOTICE '  2. Create some test exams';
    RAISE NOTICE '  3. Verify the calendar integration';
    RAISE NOTICE '============================================================================';
END $$;












