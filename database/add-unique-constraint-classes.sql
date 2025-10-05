-- Migration: Add Unique Constraint to Classes Table
-- This migration adds a unique constraint to prevent duplicate classes
-- based on student_id, date, start_time, and end_time combination

-- ========================================
-- UNIQUE CONSTRAINT FOR CLASSES TABLE
-- ========================================
-- This constraint ensures that no duplicate classes can be created
-- for the same student on the same date and time slot

-- For SQLite (local development)
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_unique_slot 
ON classes(student_id, date, start_time, end_time);

-- For PostgreSQL/Supabase (production)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_unique_slot 
-- ON classes(student_id, date, start_time, end_time);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Use these queries to verify the constraint is working:

-- 1. Check if the unique index was created successfully
-- SELECT name, sql FROM sqlite_master WHERE type='index' AND name='idx_classes_unique_slot';

-- 2. Test the constraint by trying to insert a duplicate
-- (This should fail if the constraint is working)
-- INSERT INTO classes (student_id, date, start_time, end_time, duration, day_of_week, is_recurring, status, price)
-- VALUES (1, '2024-01-15', '10:00', '11:00', 60, 1, 1, 'scheduled', 25.00);

-- 3. Check for existing duplicates before adding the constraint
-- SELECT student_id, date, start_time, end_time, COUNT(*) as count
-- FROM classes 
-- GROUP BY student_id, date, start_time, end_time 
-- HAVING COUNT(*) > 1;

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
