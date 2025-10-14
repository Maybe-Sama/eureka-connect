-- Añadir campo receptor_tipo_identificacion a la tabla facturas_rrsif
ALTER TABLE facturas_rrsif 
ADD COLUMN receptor_tipo_identificacion TEXT DEFAULT 'DNI';

-- Comentario para documentar el campo
COMMENT ON COLUMN facturas_rrsif.receptor_tipo_identificacion IS 'Tipo de identificación del receptor: DNI o NIF';

