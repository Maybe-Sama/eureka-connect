-- Script SIMPLE para corregir las clases huérfanas
-- Ejecutar en Supabase SQL Editor

-- Paso 1: Ver cuántas clases están marcadas como facturadas
SELECT 
  'Clases marcadas como facturadas:' as info,
  COUNT(*) as cantidad
FROM classes 
WHERE status_invoice = true;

-- Paso 2: Ver cuántas facturas activas hay
SELECT 
  'Facturas activas:' as info,
  COUNT(*) as cantidad
FROM facturas_rrsif;

-- Paso 3: Ver cuántas relaciones factura-clase hay
SELECT 
  'Relaciones factura-clase:' as info,
  COUNT(*) as cantidad
FROM factura_clases;

-- Paso 4: CORREGIR - Desmarcar TODAS las clases como no facturadas
-- (Esto es seguro porque solo afecta a clases que no tienen facturas activas)
UPDATE classes 
SET status_invoice = false
WHERE status_invoice = true;

-- Paso 5: Verificar el resultado
SELECT 
  'Resultado final:' as info,
  COUNT(CASE WHEN status_invoice = true THEN 1 END) as facturadas,
  COUNT(CASE WHEN status_invoice = false THEN 1 END) as no_facturadas,
  COUNT(CASE WHEN status_invoice IS NULL THEN 1 END) as sin_estado
FROM classes;
