-- Script para verificar el estado de factura_clases
-- ================================================

-- 1. Ver la estructura de la tabla
\d factura_clases;

-- 2. Ver los datos actuales
SELECT id, factura_id, clase_id, asignatura, precio 
FROM factura_clases 
ORDER BY id;

-- 3. Verificar la secuencia
SELECT last_value, is_called 
FROM factura_clases_id_seq;

-- 4. Contar registros
SELECT COUNT(*) as total_registros FROM factura_clases;

-- 5. Ver el rango de IDs
SELECT MIN(id) as min_id, MAX(id) as max_id FROM factura_clases;



