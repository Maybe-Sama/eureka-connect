-- =====================================================
-- MIGRACIÓN: Agregar campo incluye_qr a facturas_rrsif
-- =====================================================
-- Este script debe ejecutarse en el SQL Editor de Supabase

-- 1. Agregar el campo incluye_qr si no existe
ALTER TABLE facturas_rrsif 
ADD COLUMN IF NOT EXISTS incluye_qr BOOLEAN DEFAULT FALSE;

-- 2. Actualizar facturas existentes
-- Si una factura tiene hash_registro, asumimos que tiene QR
UPDATE facturas_rrsif 
SET incluye_qr = TRUE 
WHERE hash_registro IS NOT NULL 
  AND hash_registro != '' 
  AND hash_registro != 'null';

-- 3. Verificar que el campo se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'facturas_rrsif' 
  AND column_name = 'incluye_qr';

-- 4. Mostrar algunas facturas para verificar
SELECT id, invoice_number, incluye_qr, hash_registro 
FROM facturas_rrsif 
ORDER BY created_at DESC 
LIMIT 5;
