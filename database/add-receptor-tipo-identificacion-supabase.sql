-- Añadir campo receptor_tipo_identificacion a la tabla facturas_rrsif en Supabase
-- Este script debe ejecutarse en el SQL Editor de Supabase

ALTER TABLE facturas_rrsif 
ADD COLUMN receptor_tipo_identificacion TEXT DEFAULT 'DNI';

-- Comentario para documentar el campo
COMMENT ON COLUMN facturas_rrsif.receptor_tipo_identificacion IS 'Tipo de identificación del receptor: DNI o NIF';

-- Verificar que se añadió correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'facturas_rrsif' 
AND column_name = 'receptor_tipo_identificacion';
