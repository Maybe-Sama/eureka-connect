-- Script para resetear la secuencia de factura_clases
-- ===================================================

-- 1. Verificar el estado actual
SELECT 
    'Estado actual de la tabla:' as info,
    COUNT(*) as total_registros,
    MIN(id) as min_id,
    MAX(id) as max_id
FROM factura_clases;

-- 2. Verificar la secuencia actual
SELECT 
    'Estado de la secuencia:' as info,
    last_value,
    is_called
FROM factura_clases_id_seq;

-- 3. Resetear la secuencia al valor correcto
-- Primero obtenemos el máximo ID actual
DO $$
DECLARE
    max_id INTEGER;
BEGIN
    -- Obtener el máximo ID actual
    SELECT COALESCE(MAX(id), 0) INTO max_id FROM factura_clases;
    
    -- Resetear la secuencia
    PERFORM setval('factura_clases_id_seq', max_id + 1, false);
    
    RAISE NOTICE 'Secuencia reseteada. Próximo ID será: %', max_id + 1;
END $$;

-- 4. Verificar que la secuencia está correcta
SELECT 
    'Secuencia después del reset:' as info,
    last_value,
    is_called
FROM factura_clases_id_seq;

-- 5. Probar insertando un registro de prueba (opcional)
-- INSERT INTO factura_clases (factura_id, clase_id, fecha, hora_inicio, hora_fin, duracion, asignatura, precio)
-- VALUES ('test-sequence', 999, '2025-01-01', '10:00', '11:00', 60, 'Test Secuencia', 25.00);

-- 6. Verificar el resultado (descomenta si ejecutaste el insert de prueba)
-- SELECT * FROM factura_clases WHERE factura_id = 'test-sequence';



