-- Agregar campo incluye_qr a la tabla facturas_rrsif
-- Este script debe ejecutarse en Supabase para agregar el campo a la tabla existente

ALTER TABLE facturas_rrsif 
ADD COLUMN IF NOT EXISTS incluye_qr BOOLEAN DEFAULT FALSE;

-- Actualizar facturas existentes para que tengan incluye_qr = true si tienen hash_registro
UPDATE facturas_rrsif 
SET incluye_qr = TRUE 
WHERE hash_registro IS NOT NULL AND hash_registro != '';

-- Comentario: Este script agrega el campo incluye_qr para controlar si una factura tiene QR o no
