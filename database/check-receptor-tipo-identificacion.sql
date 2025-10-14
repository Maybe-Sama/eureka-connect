-- Verificar si existe el campo receptor_tipo_identificacion en la tabla facturas_rrsif
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'facturas_rrsif' 
AND column_name = 'receptor_tipo_identificacion';

-- Si no existe, añadirlo
ALTER TABLE facturas_rrsif 
ADD COLUMN IF NOT EXISTS receptor_tipo_identificacion TEXT DEFAULT 'DNI';

-- Verificar que se añadió correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'facturas_rrsif' 
AND column_name = 'receptor_tipo_identificacion';
