-- Agregar campo status_invoice a la tabla classes
-- Este campo indica si una clase ya ha sido incluida en una factura

-- Agregar la columna status_invoice a la tabla classes
ALTER TABLE classes ADD COLUMN status_invoice BOOLEAN DEFAULT false;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_classes_status_invoice ON classes(status_invoice);

-- Actualizar todas las clases existentes para que tengan status_invoice = false (no facturadas)
UPDATE classes SET status_invoice = false WHERE status_invoice IS NULL;

-- Comentario: 
-- status_invoice = false: La clase NO ha sido incluida en ninguna factura
-- status_invoice = true: La clase YA ha sido incluida en una factura
