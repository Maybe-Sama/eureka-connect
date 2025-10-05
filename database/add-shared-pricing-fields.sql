-- ============================================================================
-- ADD SHARED PRICING FIELDS TO COURSES AND STUDENTS TABLES
-- ============================================================================
-- This migration adds support for shared class pricing
-- Execute this script in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Add shared_class_price to courses table
-- ============================================================================
-- This field stores the discounted price for students who attend shared classes

DO $$ 
BEGIN
    -- Check if shared_class_price column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'shared_class_price'
    ) THEN
        ALTER TABLE public.courses ADD COLUMN shared_class_price REAL;
        RAISE NOTICE 'Added shared_class_price column to courses table';
    ELSE
        RAISE NOTICE 'shared_class_price column already exists in courses table';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Add has_shared_pricing to students table
-- ============================================================================
-- This boolean field indicates if a student uses shared class pricing

DO $$ 
BEGIN
    -- Check if has_shared_pricing column exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'has_shared_pricing'
    ) THEN
        ALTER TABLE public.students ADD COLUMN has_shared_pricing BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added has_shared_pricing column to students table';
    ELSE
        RAISE NOTICE 'has_shared_pricing column already exists in students table';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Create index for has_shared_pricing queries
-- ============================================================================
-- Optimize queries that filter students by pricing type

CREATE INDEX IF NOT EXISTS idx_students_has_shared_pricing 
ON public.students(has_shared_pricing);

-- ============================================================================
-- STEP 4: Update existing courses to set default shared_class_price
-- ============================================================================
-- Set shared_class_price to 80% of regular price for existing courses
-- You can adjust this percentage as needed

UPDATE public.courses 
SET shared_class_price = price * 0.8 
WHERE shared_class_price IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Verify the changes were applied successfully

DO $$
DECLARE
    courses_column_exists BOOLEAN;
    students_column_exists BOOLEAN;
    courses_count INTEGER;
    students_count INTEGER;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'courses' 
        AND column_name = 'shared_class_price'
    ) INTO courses_column_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'students' 
        AND column_name = 'has_shared_pricing'
    ) INTO students_column_exists;
    
    -- Get counts
    SELECT COUNT(*) FROM public.courses INTO courses_count;
    SELECT COUNT(*) FROM public.students INTO students_count;
    
    -- Report results
    RAISE NOTICE '=== MIGRATION VERIFICATION ===';
    RAISE NOTICE 'Courses.shared_class_price exists: %', courses_column_exists;
    RAISE NOTICE 'Students.has_shared_pricing exists: %', students_column_exists;
    RAISE NOTICE 'Total courses: %', courses_count;
    RAISE NOTICE 'Total students: %', students_count;
    RAISE NOTICE '=============================';
    
    IF courses_column_exists AND students_column_exists THEN
        RAISE NOTICE 'Migration completed successfully! ✓';
    ELSE
        RAISE EXCEPTION 'Migration failed - some columns were not created';
    END IF;
END $$;
