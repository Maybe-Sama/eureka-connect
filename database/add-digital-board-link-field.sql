-- ============================================================================
-- MIGRACIÓN: Añadir campo digital_board_link a la tabla students
-- ============================================================================
-- Este script añade el campo digital_board_link a la tabla students
-- para almacenar enlaces a pizarras digitales específicas de cada estudiante
-- ============================================================================

-- Verificar si la columna ya existe y añadirla si no existe
DO $$ 
BEGIN
    -- Verificar si la columna digital_board_link ya existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'digital_board_link') THEN
        -- Añadir la columna digital_board_link
        ALTER TABLE public.students ADD COLUMN digital_board_link TEXT;
        RAISE NOTICE 'Added digital_board_link column to students table';
    ELSE
        RAISE NOTICE 'digital_board_link column already exists in students table';
    END IF;
END $$;

-- ============================================================================
-- CREAR ÍNDICE PARA OPTIMIZAR CONSULTAS
-- ============================================================================
-- Crear índice para búsquedas por enlace de pizarra digital
CREATE INDEX IF NOT EXISTS idx_students_digital_board_link ON public.students(digital_board_link);

-- ============================================================================
-- AÑADIR COMENTARIO PARA DOCUMENTACIÓN
-- ============================================================================
-- Añadir comentario a la columna para documentar su propósito
COMMENT ON COLUMN public.students.digital_board_link IS 'URL de la pizarra digital específica para este estudiante';

-- ============================================================================
-- VERIFICACIÓN FINAL
-- ============================================================================
-- Verificar que la columna se ha añadido correctamente
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'students' 
               AND column_name = 'digital_board_link') THEN
        RAISE NOTICE 'SUCCESS: digital_board_link column successfully added to students table';
    ELSE
        RAISE NOTICE 'ERROR: digital_board_link column was not added to students table';
    END IF;
END $$;
