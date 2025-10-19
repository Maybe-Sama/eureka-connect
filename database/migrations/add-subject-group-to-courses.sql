-- Añadir campo subject_group a la tabla courses
-- Este campo almacena la ruta al grupo de asignaturas en subjects.json
-- Formato: "primaria.1_primaria" o "bachillerato.2_bachillerato.ciencias"

ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS subject_group VARCHAR(100);

-- Añadir índice para mejorar el rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_courses_subject_group ON courses(subject_group);

-- Comentario en la columna para documentación
COMMENT ON COLUMN courses.subject_group IS 'Ruta al grupo de asignaturas en subjects.json (ej: bachillerato.2_bachillerato.ciencias)';

