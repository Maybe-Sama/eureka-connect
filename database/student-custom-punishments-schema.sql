-- Tabla para castigos personalizados del alumno
CREATE TABLE student_custom_punishments (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  punishment_type_id INT NOT NULL REFERENCES punishment_types(id) ON DELETE CASCADE,
  is_unlocked BOOLEAN DEFAULT TRUE, -- Si el profesor ha desbloqueado este castigo
  is_selected BOOLEAN DEFAULT FALSE, -- Si el alumno lo ha seleccionado para su ruleta
  order_position INT DEFAULT 0, -- Orden de menor a mayor fastidio (1-5)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Asegurar que cada alumno solo puede tener un castigo por posición
  UNIQUE(student_id, order_position),
  -- Asegurar que cada alumno solo puede tener un castigo por tipo
  UNIQUE(student_id, punishment_type_id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX idx_student_custom_punishments_student_id ON student_custom_punishments (student_id);
CREATE INDEX idx_student_custom_punishments_is_unlocked ON student_custom_punishments (is_unlocked);
CREATE INDEX idx_student_custom_punishments_is_selected ON student_custom_punishments (is_selected);

-- RLS para student_custom_punishments
ALTER TABLE student_custom_punishments ENABLE ROW LEVEL SECURITY;

-- Los profesores pueden ver y modificar todos los castigos personalizados
CREATE POLICY "Teachers can manage all student custom punishments" ON student_custom_punishments
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'teacher')
);

-- Los estudiantes solo pueden ver y modificar sus propios castigos personalizados
CREATE POLICY "Students can manage their own custom punishments" ON student_custom_punishments
FOR ALL USING (
  student_id IN (SELECT student_id FROM users WHERE id = auth.uid() AND user_type = 'student')
);

-- Tabla para sesiones de ruleta (para sincronización en tiempo real)
CREATE TABLE roulette_sessions (
  id SERIAL PRIMARY KEY,
  student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id INT REFERENCES users(id) ON DELETE SET NULL,
  session_status VARCHAR(20) DEFAULT 'waiting', -- waiting, spinning, completed
  selected_punishment_id INT REFERENCES punishment_types(id) ON DELETE SET NULL,
  spin_started_at TIMESTAMP WITH TIME ZONE,
  spin_completed_at TIMESTAMP WITH TIME ZONE,
  result_id INT REFERENCES punishment_results(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para roulette_sessions
CREATE INDEX idx_roulette_sessions_student_id ON roulette_sessions (student_id);
CREATE INDEX idx_roulette_sessions_status ON roulette_sessions (session_status);
CREATE INDEX idx_roulette_sessions_created_at ON roulette_sessions (created_at);

-- RLS para roulette_sessions
ALTER TABLE roulette_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage all roulette sessions" ON roulette_sessions
FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'teacher')
);

CREATE POLICY "Students can view their own roulette sessions" ON roulette_sessions
FOR SELECT USING (
  student_id IN (SELECT student_id FROM users WHERE id = auth.uid() AND user_type = 'student')
);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_student_custom_punishments_updated_at
BEFORE UPDATE ON student_custom_punishments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roulette_sessions_updated_at
BEFORE UPDATE ON roulette_sessions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Función para inicializar castigos personalizados para un estudiante
CREATE OR REPLACE FUNCTION initialize_student_custom_punishments(student_id_param INT)
RETURNS VOID AS $$
BEGIN
  -- Insertar todos los tipos de castigos activos como disponibles para el estudiante
  INSERT INTO student_custom_punishments (student_id, punishment_type_id, is_unlocked, is_selected, order_position)
  SELECT 
    student_id_param,
    pt.id,
    TRUE, -- Inicialmente desbloqueados
    FALSE, -- Inicialmente no seleccionados
    0 -- Sin orden inicial
  FROM punishment_types pt
  WHERE pt.is_active = TRUE
  ON CONFLICT (student_id, punishment_type_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;


