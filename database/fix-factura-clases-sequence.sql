-- Script para corregir la secuencia de factura_clases
-- =====================================================

-- 1. Verificar el estado actual de la secuencia
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_identity,
    identity_generation
FROM information_schema.columns 
WHERE table_name = 'factura_clases' 
AND column_name = 'id';

-- 2. Verificar si existe la secuencia
SELECT sequence_name, last_value, is_called
FROM pg_sequences 
WHERE sequence_name LIKE '%factura_clases%';

-- 3. Ver los datos actuales de la tabla
SELECT id, factura_id, clase_id, asignatura 
FROM factura_clases 
ORDER BY id 
LIMIT 10;

-- 4. Si la secuencia no existe o está corrupta, recrearla
-- Primero eliminar la tabla si es necesario (¡CUIDADO! Esto borra todos los datos)
-- DROP TABLE IF EXISTS factura_clases CASCADE;

-- 5. Recrear la tabla con la secuencia correcta
CREATE TABLE IF NOT EXISTS factura_clases (
    id SERIAL PRIMARY KEY,
    factura_id TEXT NOT NULL,
    clase_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    duracion INTEGER NOT NULL,
    asignatura TEXT NOT NULL,
    precio REAL NOT NULL,
    
    FOREIGN KEY (factura_id) REFERENCES facturas_rrsif(id) ON DELETE CASCADE,
    FOREIGN KEY (clase_id) REFERENCES classes(id)
);

-- 6. Si ya existe la tabla, solo corregir la secuencia
-- Obtener el máximo ID actual
SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM factura_clases;

-- Resetear la secuencia al valor correcto
-- (Reemplazar XXXX con el valor obtenido del query anterior)
-- SELECT setval('factura_clases_id_seq', XXXX, false);

-- 7. Verificar que la secuencia funciona correctamente
-- INSERT INTO factura_clases (factura_id, clase_id, fecha, hora_inicio, hora_fin, duracion, asignatura, precio)
-- VALUES ('test', 1, '2025-01-01', '10:00', '11:00', 60, 'Test', 25.00);

-- 8. Verificar el resultado
-- SELECT * FROM factura_clases ORDER BY id DESC LIMIT 5;














