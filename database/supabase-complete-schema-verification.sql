-- ============================================================================
-- SUPABASE COMPLETE SCHEMA VERIFICATION AND SETUP
-- ============================================================================
-- This script verifies and sets up the complete schema for the class tracking system
-- Run this in Supabase SQL Editor to ensure all columns, indices, and constraints are in place
-- ============================================================================

-- ============================================================================
-- STEP 1: Verify and Add Missing Columns to classes Table
-- ============================================================================

-- Check if columns exist and add them if missing
DO $$ 
BEGIN
    -- Add course_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'classes' 
                   AND column_name = 'course_id') THEN
        ALTER TABLE public.classes ADD COLUMN course_id INTEGER;
        ALTER TABLE public.classes ADD CONSTRAINT fk_classes_course 
            FOREIGN KEY (course_id) REFERENCES public.courses(id);
        RAISE NOTICE 'Added course_id column';
    END IF;

    -- Add subject column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'classes' 
                   AND column_name = 'subject') THEN
        ALTER TABLE public.classes ADD COLUMN subject TEXT;
        RAISE NOTICE 'Added subject column';
    END IF;

    -- Add notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'classes' 
                   AND column_name = 'notes') THEN
        ALTER TABLE public.classes ADD COLUMN notes TEXT;
        RAISE NOTICE 'Added notes column';
    END IF;

    -- Add payment_status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'classes' 
                   AND column_name = 'payment_status') THEN
        ALTER TABLE public.classes ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
        RAISE NOTICE 'Added payment_status column';
    END IF;

    -- Add payment_notes column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'classes' 
                   AND column_name = 'payment_notes') THEN
        ALTER TABLE public.classes ADD COLUMN payment_notes TEXT DEFAULT '';
        RAISE NOTICE 'Added payment_notes column';
    END IF;

    -- Add payment_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'classes' 
                   AND column_name = 'payment_date') THEN
        ALTER TABLE public.classes ADD COLUMN payment_date TEXT;
        RAISE NOTICE 'Added payment_date column';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Add CHECK Constraint for payment_status
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                   WHERE table_schema = 'public' 
                   AND table_name = 'classes' 
                   AND constraint_name = 'check_payment_status') THEN
        ALTER TABLE public.classes ADD CONSTRAINT check_payment_status
            CHECK (payment_status IN ('unpaid', 'paid'));
        RAISE NOTICE 'Added check_payment_status constraint';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Add CHECK Constraint for status
-- ============================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage 
                   WHERE table_schema = 'public' 
                   AND table_name = 'classes' 
                   AND constraint_name = 'check_status') THEN
        ALTER TABLE public.classes ADD CONSTRAINT check_status
            CHECK (status IN ('scheduled', 'completed', 'cancelled'));
        RAISE NOTICE 'Added check_status constraint';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Create Unique Index for Duplicate Prevention
-- ============================================================================

-- Drop existing index if it exists (to recreate with correct definition)
DROP INDEX IF EXISTS public.idx_classes_unique_slot;

-- Create unique index to prevent duplicate classes
CREATE UNIQUE INDEX IF NOT EXISTS idx_classes_unique_slot 
ON public.classes(student_id, date, start_time, end_time);

COMMENT ON INDEX public.idx_classes_unique_slot IS 
'Prevents duplicate classes for the same student at the same date and time. Used by generateClassesFromStartDate for duplicate prevention.';

-- ============================================================================
-- STEP 5: Create Performance Indices
-- ============================================================================

-- Index for student_id lookups
CREATE INDEX IF NOT EXISTS idx_classes_student_id 
ON public.classes(student_id);

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_classes_date 
ON public.classes(date);

-- Index for day_of_week queries
CREATE INDEX IF NOT EXISTS idx_classes_day_of_week 
ON public.classes(day_of_week);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_classes_status 
ON public.classes(status);

-- Index for payment_status queries
CREATE INDEX IF NOT EXISTS idx_classes_payment_status 
ON public.classes(payment_status);

-- Index for payment_date queries
CREATE INDEX IF NOT EXISTS idx_classes_payment_date 
ON public.classes(payment_date);

-- Index for is_recurring queries
CREATE INDEX IF NOT EXISTS idx_classes_is_recurring 
ON public.classes(is_recurring);

-- Composite index for common queries (student + date range)
CREATE INDEX IF NOT EXISTS idx_classes_student_date 
ON public.classes(student_id, date);

-- ============================================================================
-- STEP 6: Verify students Table Columns
-- ============================================================================

DO $$ 
BEGIN
    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'start_date') THEN
        ALTER TABLE public.students ADD COLUMN start_date TEXT;
        RAISE NOTICE 'Added start_date column to students';
    END IF;

    -- Add fixed_schedule column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'fixed_schedule') THEN
        ALTER TABLE public.students ADD COLUMN fixed_schedule TEXT;
        RAISE NOTICE 'Added fixed_schedule column to students';
    END IF;
END $$;

-- ============================================================================
-- STEP 7: Create Function to Check for Duplicate Classes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_duplicate_classes()
RETURNS TABLE (
    student_id INTEGER,
    date TEXT,
    start_time TEXT,
    end_time TEXT,
    duplicate_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.student_id,
        c.date,
        c.start_time,
        c.end_time,
        COUNT(*) as duplicate_count
    FROM public.classes c
    GROUP BY c.student_id, c.date, c.start_time, c.end_time
    HAVING COUNT(*) > 1
    ORDER BY duplicate_count DESC, c.student_id, c.date;
END;
$$;

COMMENT ON FUNCTION public.check_duplicate_classes() IS 
'Returns all duplicate classes in the system. Used for data cleanup and verification.';

-- ============================================================================
-- STEP 8: Create Function to Remove Duplicate Classes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.remove_duplicate_classes()
RETURNS TABLE (
    deleted_count INTEGER,
    message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    -- Delete duplicates, keeping only the oldest record (lowest id)
    WITH duplicates AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY student_id, date, start_time, end_time 
                ORDER BY id
            ) as rn
        FROM public.classes
    )
    DELETE FROM public.classes
    WHERE id IN (
        SELECT id FROM duplicates WHERE rn > 1
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_count, 
        CASE 
            WHEN v_deleted_count = 0 THEN 'No duplicate classes found'
            WHEN v_deleted_count = 1 THEN '1 duplicate class removed'
            ELSE v_deleted_count || ' duplicate classes removed'
        END;
END;
$$;

COMMENT ON FUNCTION public.remove_duplicate_classes() IS 
'Removes all duplicate classes, keeping only the oldest record for each unique combination of student_id, date, start_time, end_time.';

-- ============================================================================
-- STEP 9: Verification Queries
-- ============================================================================

-- Check all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'classes'
ORDER BY ordinal_position;

-- Check all indices exist
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
AND tablename = 'classes'
ORDER BY indexname;

-- Check for duplicate classes
SELECT * FROM public.check_duplicate_classes();

-- ============================================================================
-- STEP 10: Data Quality Checks
-- ============================================================================

-- Count classes by status
SELECT status, COUNT(*) as count
FROM public.classes
GROUP BY status
ORDER BY count DESC;

-- Count classes by payment_status
SELECT payment_status, COUNT(*) as count
FROM public.classes
GROUP BY payment_status
ORDER BY count DESC;

-- Count classes by is_recurring
SELECT is_recurring, COUNT(*) as count
FROM public.classes
GROUP BY is_recurring
ORDER BY count DESC;

-- Check for classes with missing required fields
SELECT 
    COUNT(*) as missing_course_id
FROM public.classes
WHERE course_id IS NULL;

SELECT 
    COUNT(*) as missing_status
FROM public.classes
WHERE status IS NULL;

SELECT 
    COUNT(*) as missing_payment_status
FROM public.classes
WHERE payment_status IS NULL;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SUPABASE SCHEMA VERIFICATION AND SETUP COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'All required columns, indices, and constraints have been verified/created.';
    RAISE NOTICE 'Review the verification queries above to confirm everything is correct.';
    RAISE NOTICE '============================================================================';
END $$;
