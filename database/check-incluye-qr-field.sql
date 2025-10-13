-- =====================================================
-- VERIFICACIÓN: Comprobar si existe el campo incluye_qr
-- =====================================================
-- Este script verifica si el campo incluye_qr existe en la tabla facturas_rrsif

-- 1. Verificar si el campo existe
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'facturas_rrsif' 
  AND column_name = 'incluye_qr';

-- 2. Si no existe, mostrarlo
SELECT 'Campo incluye_qr NO existe en la tabla facturas_rrsif' as status
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'facturas_rrsif' 
    AND column_name = 'incluye_qr'
);

-- 3. Mostrar estructura actual de la tabla
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'facturas_rrsif' 
ORDER BY ordinal_position;
