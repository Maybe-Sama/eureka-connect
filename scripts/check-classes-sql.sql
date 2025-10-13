-- Script SQL para verificar el estado de las clases
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar que el campo status_invoice existe
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'classes' 
AND column_name = 'status_invoice';

-- 2. Ver las últimas 10 clases con su estado
SELECT 
  id,
  date,
  start_time,
  end_time,
  price,
  payment_status,
  status,
  status_invoice,
  subject
FROM classes 
ORDER BY id DESC 
LIMIT 10;

-- 3. Contar clases por estado de facturación
SELECT 
  status_invoice,
  COUNT(*) as cantidad
FROM classes 
GROUP BY status_invoice;

-- 4. Contar clases por estado de pago
SELECT 
  payment_status,
  COUNT(*) as cantidad
FROM classes 
GROUP BY payment_status;

-- 5. Clases que DEBERÍAN estar disponibles para facturar
-- (payment_status = 'paid' O status = 'completed') Y status_invoice != true
SELECT 
  id,
  date,
  start_time,
  end_time,
  price,
  payment_status,
  status,
  status_invoice,
  subject
FROM classes 
WHERE (payment_status = 'paid' OR status = 'completed')
  AND (status_invoice IS NULL OR status_invoice = false)
ORDER BY id DESC;

-- 6. Clases marcadas como facturadas
SELECT 
  id,
  date,
  start_time,
  end_time,
  price,
  payment_status,
  status,
  status_invoice,
  subject
FROM classes 
WHERE status_invoice = true
ORDER BY id DESC;
