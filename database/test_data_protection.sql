-- Script para verificar que la protección de datos funciona
-- Ejecutar en Supabase SQL Editor

-- 1. Ver clases con datos críticos existentes
SELECT 
    id,
    student_id,
    date,
    status,
    payment_status,
    subject,
    notes,
    payment_notes,
    status_invoice,
    CASE 
        WHEN payment_status = 'paid' THEN 'CRÍTICO: Pagada'
        WHEN status = 'completed' THEN 'CRÍTICO: Completada'
        WHEN subject IS NOT NULL AND subject != '' THEN 'CRÍTICO: Tiene asignatura'
        WHEN notes IS NOT NULL AND notes != '' THEN 'CRÍTICO: Tiene notas'
        WHEN payment_notes IS NOT NULL AND payment_notes != '' THEN 'CRÍTICO: Tiene notas de pago'
        WHEN status_invoice = 1 THEN 'CRÍTICO: Ya facturada'
        ELSE 'SEGURO: Sin datos críticos'
    END as protection_status
FROM classes 
WHERE student_id IN (
    SELECT id FROM students 
    WHERE first_name LIKE '%Cayetana%' OR last_name LIKE '%Rubio%'
)
ORDER BY date DESC;

-- 2. Contar clases por estado de protección
SELECT 
    CASE 
        WHEN payment_status = 'paid' THEN 'CRÍTICO: Pagada'
        WHEN status = 'completed' THEN 'CRÍTICO: Completada'
        WHEN subject IS NOT NULL AND subject != '' THEN 'CRÍTICO: Tiene asignatura'
        WHEN notes IS NOT NULL AND notes != '' THEN 'CRÍTICO: Tiene notas'
        WHEN payment_notes IS NOT NULL AND payment_notes != '' THEN 'CRÍTICO: Tiene notas de pago'
        WHEN status_invoice = 1 THEN 'CRÍTICO: Ya facturada'
        ELSE 'SEGURO: Sin datos críticos'
    END as protection_status,
    COUNT(*) as count
FROM classes 
GROUP BY 
    CASE 
        WHEN payment_status = 'paid' THEN 'CRÍTICO: Pagada'
        WHEN status = 'completed' THEN 'CRÍTICO: Completada'
        WHEN subject IS NOT NULL AND subject != '' THEN 'CRÍTICO: Tiene asignatura'
        WHEN notes IS NOT NULL AND notes != '' THEN 'CRÍTICO: Tiene notas'
        WHEN payment_notes IS NOT NULL AND payment_notes != '' THEN 'CRÍTICO: Tiene notas de pago'
        WHEN status_invoice = 1 THEN 'CRÍTICO: Ya facturada'
        ELSE 'SEGURO: Sin datos críticos'
    END
ORDER BY count DESC;

