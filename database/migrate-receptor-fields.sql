
-- Migración: Agregar campos del receptor a la tabla students
-- Ejecutar este SQL en la base de datos

-- Agregar campos que no existen
ALTER TABLE students ADD COLUMN parent_contact_type TEXT CHECK(parent_contact_type IN ("padre", "madre", "tutor"));
ALTER TABLE students ADD COLUMN student_code TEXT;
ALTER TABLE students ADD COLUMN fixed_schedule TEXT;
ALTER TABLE students ADD COLUMN start_date TEXT;
ALTER TABLE students ADD COLUMN dni TEXT;
ALTER TABLE students ADD COLUMN nif TEXT;
ALTER TABLE students ADD COLUMN address TEXT;
ALTER TABLE students ADD COLUMN postal_code TEXT;
ALTER TABLE students ADD COLUMN city TEXT;
ALTER TABLE students ADD COLUMN province TEXT;
ALTER TABLE students ADD COLUMN country TEXT DEFAULT 'España';
ALTER TABLE students ADD COLUMN receptor_nombre TEXT;
ALTER TABLE students ADD COLUMN receptor_apellidos TEXT;
ALTER TABLE students ADD COLUMN receptor_email TEXT;

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_students_student_code ON students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_dni ON students(dni);
CREATE INDEX IF NOT EXISTS idx_students_nif ON students(nif);
CREATE INDEX IF NOT EXISTS idx_students_receptor_email ON students(receptor_email);
