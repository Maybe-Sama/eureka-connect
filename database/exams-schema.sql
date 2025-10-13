-- Esquema para la tabla de exámenes
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME,
    notes TEXT,
    grade DECIMAL(4,2) CHECK (grade >= 0 AND grade <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_exams_student_id ON exams(student_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(exam_date);
CREATE INDEX IF NOT EXISTS idx_exams_student_date ON exams(student_id, exam_date);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_exams_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW
    EXECUTE FUNCTION update_exams_updated_at();

-- RLS (Row Level Security) policies
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;

-- Política para que los estudiantes solo vean sus propios exámenes
CREATE POLICY "Students can view their own exams" ON exams
    FOR SELECT USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN system_users su ON s.id = su.student_id
            WHERE su.id = (
                SELECT us.user_id FROM user_sessions us
                WHERE us.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
                AND us.expires_at > NOW()
            )
        )
    );

CREATE POLICY "Students can insert their own exams" ON exams
    FOR INSERT WITH CHECK (
        student_id IN (
            SELECT s.id FROM students s
            JOIN system_users su ON s.id = su.student_id
            WHERE su.id = (
                SELECT us.user_id FROM user_sessions us
                WHERE us.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
                AND us.expires_at > NOW()
            )
        )
    );

CREATE POLICY "Students can update their own exams" ON exams
    FOR UPDATE USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN system_users su ON s.id = su.student_id
            WHERE su.id = (
                SELECT us.user_id FROM user_sessions us
                WHERE us.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
                AND us.expires_at > NOW()
            )
        )
    );

CREATE POLICY "Students can delete their own exams" ON exams
    FOR DELETE USING (
        student_id IN (
            SELECT s.id FROM students s
            JOIN system_users su ON s.id = su.student_id
            WHERE su.id = (
                SELECT us.user_id FROM user_sessions us
                WHERE us.session_token = current_setting('request.jwt.claims', true)::json->>'session_token'
                AND us.expires_at > NOW()
            )
        )
    );
