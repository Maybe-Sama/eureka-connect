-- Esquema para el sistema de castigos/ruleta
-- Tabla para configurar los castigos disponibles
CREATE TABLE IF NOT EXISTS punishment_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) NOT NULL, -- Color en formato hex
    severity INTEGER NOT NULL DEFAULT 1, -- 1-5, de menor a mayor fastidio
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para registrar los resultados de la ruleta
CREATE TABLE IF NOT EXISTS punishment_results (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    punishment_type_id INTEGER NOT NULL REFERENCES punishment_types(id) ON DELETE CASCADE,
    teacher_id INTEGER, -- ID del profesor que lanzó la ruleta (opcional)
    result_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    notes TEXT, -- Notas adicionales del profesor
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para configuraciones globales del sistema de castigos
CREATE TABLE IF NOT EXISTS punishment_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar castigos por defecto
INSERT INTO punishment_types (name, description, color, severity) VALUES
('5 minutos extra de deberes', 'Tiempo adicional de trabajo académico', '#fdd835', 1),
('Traer resumen adicional', 'Preparar material extra para la próxima clase', '#ffb300', 2),
('Ayudar a limpiar el aula', 'Tarea de mantenimiento del espacio de estudio', '#fb8c00', 3),
('Exponer tema sorpresa', 'Presentación improvisada sobre un tema aleatorio', '#f4511e', 4),
('Trabajo adicional', 'Asignación extra de trabajo académico', '#e53935', 5)
ON CONFLICT DO NOTHING;

-- Insertar configuraciones por defecto
INSERT INTO punishment_settings (setting_key, setting_value, description) VALUES
('roulette_enabled', 'true', 'Habilitar/deshabilitar el sistema de ruleta'),
('max_punishments_per_day', '3', 'Máximo número de castigos por día por estudiante'),
('auto_complete_after_days', '7', 'Días después de los cuales se marca como completado automáticamente')
ON CONFLICT (setting_key) DO NOTHING;

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_punishment_results_student_id ON punishment_results(student_id);
CREATE INDEX IF NOT EXISTS idx_punishment_results_date ON punishment_results(result_date);
CREATE INDEX IF NOT EXISTS idx_punishment_results_completed ON punishment_results(is_completed);
CREATE INDEX IF NOT EXISTS idx_punishment_types_active ON punishment_types(is_active);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_punishment_types_updated_at 
    BEFORE UPDATE ON punishment_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_punishment_results_updated_at 
    BEFORE UPDATE ON punishment_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_punishment_settings_updated_at 
    BEFORE UPDATE ON punishment_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
