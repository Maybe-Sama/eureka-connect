-- Supabase Migration: Add Unique Constraint to Classes Table
-- Execute this in the Supabase SQL Editor to add the unique constraint

-- ========================================
-- UNIQUE CONSTRAINT FOR CLASSES TABLE
-- ========================================
-- This constraint ensures that no duplicate classes can be created
-- for the same student on the same date and time slot

-- Create unique index to prevent duplicate classes
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_unique_slot 
ON classes(student_id, date, start_time, end_time);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Use these queries in Supabase SQL Editor to verify:

-- 1. Check if the unique index was created successfully
SELECT 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE tablename = 'classes' 
AND indexname = 'idx_classes_unique_slot';

-- 2. Check for existing duplicates (should return empty if no duplicates exist)
SELECT 
    student_id, 
    date, 
    start_time, 
    end_time, 
    COUNT(*) as duplicate_count
FROM classes 
GROUP BY student_id, date, start_time, end_time 
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- 3. Test the constraint by trying to insert a duplicate
-- (This should fail with a unique constraint violation)
-- INSERT INTO classes (student_id, date, start_time, end_time, duration, day_of_week, is_recurring, status, price, course_id)
-- VALUES (1, '2024-01-15', '10:00', '11:00', 60, 1, true, 'scheduled', 25.00, 1);

-- ========================================
-- ROLLBACK INSTRUCTIONS
-- ========================================
-- If you need to remove this constraint:
-- DROP INDEX IF EXISTS idx_classes_unique_slot;

-- ========================================
-- NOTES
-- ========================================
-- This unique constraint prevents:
-- - Duplicate classes for the same student on the same date and time
-- - Accidental double-insertion during class generation
-- - Data integrity issues in the class tracking system
--
-- The constraint uses the compound key:
-- - student_id: Which student the class belongs to
-- - date: The date of the class (YYYY-MM-DD format)
-- - start_time: Start time of the class (HH:MM format)
-- - end_time: End time of the class (HH:MM format)
--
-- This matches the duplicate prevention logic used in the application code
-- where we check for existing classes using the same compound key pattern.
--
-- IMPORTANT: Before applying this constraint, ensure there are no existing
-- duplicate records in the classes table. If duplicates exist, they must be
-- resolved first before the constraint can be applied.
