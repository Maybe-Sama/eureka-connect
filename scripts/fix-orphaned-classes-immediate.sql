-- Script SQL para corregir inmediatamente las clases huérfanas
-- Ejecutar en Supabase SQL Editor

-- 1. Identificar clases marcadas como facturadas que NO tienen facturas activas
WITH clases_facturadas AS (
  SELECT DISTINCT c.id, c.date, c.start_time, c.end_time, c.price, c.subject
  FROM classes c
  WHERE c.status_invoice = true
),
clases_con_facturas AS (
  SELECT DISTINCT fc.clase_id
  FROM factura_clases fc
  INNER JOIN facturas_rrsif f ON fc.factura_id = f.id
  WHERE f.estado_factura IS NOT NULL  -- Solo facturas que existen
),
clases_huerfanas AS (
  SELECT cf.*
  FROM clases_facturadas cf
  LEFT JOIN clases_con_facturas ccf ON cf.id = ccf.clase_id
  WHERE ccf.clase_id IS NULL
)
-- Mostrar las clases huérfanas
SELECT 
  'Clases huérfanas encontradas:' as mensaje,
  COUNT(*) as cantidad
FROM clases_huerfanas;

-- 2. Mostrar detalles de las clases huérfanas
WITH clases_facturadas AS (
  SELECT DISTINCT c.id, c.date, c.start_time, c.end_time, c.price, c.subject
  FROM classes c
  WHERE c.status_invoice = true
),
clases_con_facturas AS (
  SELECT DISTINCT fc.clase_id
  FROM factura_clases fc
  INNER JOIN facturas_rrsif f ON fc.factura_id = f.id
  WHERE f.estado_factura IS NOT NULL
),
clases_huerfanas AS (
  SELECT cf.*
  FROM clases_facturadas cf
  LEFT JOIN clases_con_facturas ccf ON cf.id = ccf.clase_id
  WHERE ccf.clase_id IS NULL
)
SELECT 
  id,
  date,
  start_time,
  end_time,
  price,
  subject
FROM clases_huerfanas
ORDER BY id DESC;

-- 3. CORREGIR las clases huérfanas (desmarcarlas)
WITH clases_facturadas AS (
  SELECT DISTINCT c.id
  FROM classes c
  WHERE c.status_invoice = true
),
clases_con_facturas AS (
  SELECT DISTINCT fc.clase_id
  FROM factura_clases fc
  INNER JOIN facturas_rrsif f ON fc.factura_id = f.id
  WHERE f.estado_factura IS NOT NULL
),
clases_huerfanas AS (
  SELECT cf.id
  FROM clases_facturadas cf
  LEFT JOIN clases_con_facturas ccf ON cf.id = ccf.clase_id
  WHERE ccf.clase_id IS NULL
)
UPDATE classes 
SET status_invoice = false
WHERE id IN (
  SELECT id FROM clases_huerfanas
);

-- 4. Verificar el resultado
SELECT 
  'Resultado después de la corrección:' as mensaje,
  COUNT(CASE WHEN status_invoice = true THEN 1 END) as facturadas,
  COUNT(CASE WHEN status_invoice = false THEN 1 END) as no_facturadas,
  COUNT(CASE WHEN status_invoice IS NULL THEN 1 END) as sin_estado
FROM classes;
