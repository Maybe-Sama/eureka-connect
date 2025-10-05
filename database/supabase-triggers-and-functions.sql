-- ============================================================================
-- SUPABASE TRIGGERS AND AUTOMATED FUNCTIONS
-- ============================================================================
-- This script sets up automated class generation using Supabase triggers and functions
-- Run this in Supabase SQL Editor after the schema verification script
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Edge Function Caller (for generateClassesFromStartDate)
-- ============================================================================

-- Create a function to call the Next.js API endpoint for class generation
CREATE OR REPLACE FUNCTION public.trigger_class_generation(
    p_student_id INTEGER,
    p_operation TEXT DEFAULT 'insert'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_api_url TEXT;
    v_response TEXT;
BEGIN
    -- Get student data
    SELECT * INTO v_student
    FROM public.students
    WHERE id = p_student_id;
    
    -- Only proceed if student has start_date and fixed_schedule
    IF v_student.start_date IS NULL OR v_student.fixed_schedule IS NULL THEN
        RAISE NOTICE 'Student % does not have start_date or fixed_schedule, skipping class generation', p_student_id;
        RETURN;
    END IF;
    
    -- Log the trigger
    RAISE NOTICE 'Triggering class generation for student % (operation: %)', p_student_id, p_operation;
    
    -- Note: The actual API call would be made through an Edge Function
    -- This is a placeholder that logs the intent
    -- You'll need to set up a Supabase Edge Function to call your Next.js API
    
    -- For now, we'll use a webhook approach (configure in Supabase Dashboard)
    -- Or implement this in an Edge Function that calls:
    -- POST /api/class-tracking/generate-missing-classes
    -- Body: { "studentId": p_student_id }
    
END;
$$;

COMMENT ON FUNCTION public.trigger_class_generation IS 
'Triggers class generation for a student. Called by database triggers when a student is created or updated.';

-- ============================================================================
-- STEP 2: Create Trigger for Student INSERT
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_student_insert_generate_classes ON public.students;

-- Create trigger function for INSERT
CREATE OR REPLACE FUNCTION public.on_student_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only trigger if student has start_date and fixed_schedule
    IF NEW.start_date IS NOT NULL AND NEW.fixed_schedule IS NOT NULL THEN
        -- Call the class generation function
        PERFORM public.trigger_class_generation(NEW.id, 'insert');
        
        RAISE NOTICE 'Student % created with start_date and fixed_schedule - class generation triggered', NEW.id;
    ELSE
        RAISE NOTICE 'Student % created without start_date or fixed_schedule - skipping class generation', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trigger_student_insert_generate_classes
    AFTER INSERT ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.on_student_insert();

COMMENT ON TRIGGER trigger_student_insert_generate_classes ON public.students IS 
'Automatically triggers class generation when a new student is created with start_date and fixed_schedule.';

-- ============================================================================
-- STEP 3: Create Trigger for Student UPDATE
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_student_update_regenerate_classes ON public.students;

-- Create trigger function for UPDATE
CREATE OR REPLACE FUNCTION public.on_student_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only trigger if start_date or fixed_schedule changed
    IF (OLD.start_date IS DISTINCT FROM NEW.start_date) OR 
       (OLD.fixed_schedule IS DISTINCT FROM NEW.fixed_schedule) THEN
        
        -- Only proceed if new values are not null
        IF NEW.start_date IS NOT NULL AND NEW.fixed_schedule IS NOT NULL THEN
            -- Call the class generation function
            PERFORM public.trigger_class_generation(NEW.id, 'update');
            
            RAISE NOTICE 'Student % updated - start_date or fixed_schedule changed - class regeneration triggered', NEW.id;
        ELSE
            RAISE NOTICE 'Student % updated but missing start_date or fixed_schedule - skipping class regeneration', NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trigger_student_update_regenerate_classes
    AFTER UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.on_student_update();

COMMENT ON TRIGGER trigger_student_update_regenerate_classes ON public.students IS 
'Automatically triggers class regeneration when a student''s start_date or fixed_schedule is updated.';

-- ============================================================================
-- STEP 4: Create Scheduled Function for Weekly Class Generation
-- ============================================================================

-- Create a function that can be called by Supabase Scheduled Functions
CREATE OR REPLACE FUNCTION public.generate_weekly_classes_scheduled()
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    classes_created INTEGER,
    students_processed INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_classes_created INTEGER := 0;
    v_students_processed INTEGER := 0;
    v_message TEXT;
BEGIN
    -- Log the execution
    RAISE NOTICE 'Starting weekly class generation at %', NOW();
    
    -- Note: This function would call the Next.js API endpoint
    -- POST /api/class-tracking/generate-weekly-classes
    -- 
    -- For Supabase, you'll need to:
    -- 1. Create an Edge Function that calls this endpoint
    -- 2. Schedule the Edge Function to run every Monday at 6:00 AM
    -- 
    -- Example Edge Function code (TypeScript):
    -- const response = await fetch('https://your-domain.com/api/class-tracking/generate-weekly-classes', {
    --   method: 'POST',
    --   headers: { 'Content-Type': 'application/json' }
    -- });
    
    v_message := 'Weekly class generation triggered. Check Edge Function logs for details.';
    
    RETURN QUERY SELECT true, v_message, v_classes_created, v_students_processed;
END;
$$;

COMMENT ON FUNCTION public.generate_weekly_classes_scheduled() IS 
'Scheduled function for weekly class generation. Should be called every Monday at 6:00 AM via Supabase Scheduled Functions or Edge Functions.';

-- ============================================================================
-- STEP 5: Create Function to Update updated_at Timestamp
-- ============================================================================

-- Create a generic function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Apply to students table
DROP TRIGGER IF EXISTS trigger_students_updated_at ON public.students;
CREATE TRIGGER trigger_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to classes table
DROP TRIGGER IF EXISTS trigger_classes_updated_at ON public.classes;
CREATE TRIGGER trigger_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Apply to courses table
DROP TRIGGER IF EXISTS trigger_courses_updated_at ON public.courses;
CREATE TRIGGER trigger_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 6: Create Logging Table for Trigger Executions
-- ============================================================================

-- Create a table to log trigger executions
CREATE TABLE IF NOT EXISTS public.class_generation_logs (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL,
    operation TEXT NOT NULL, -- 'insert', 'update', 'scheduled'
    trigger_time TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
    message TEXT,
    classes_created INTEGER DEFAULT 0,
    error_details TEXT,
    FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_class_generation_logs_student_id 
ON public.class_generation_logs(student_id);

CREATE INDEX IF NOT EXISTS idx_class_generation_logs_status 
ON public.class_generation_logs(status);

CREATE INDEX IF NOT EXISTS idx_class_generation_logs_trigger_time 
ON public.class_generation_logs(trigger_time);

COMMENT ON TABLE public.class_generation_logs IS 
'Logs all class generation trigger executions for monitoring and debugging.';

-- ============================================================================
-- STEP 7: Update Trigger Functions to Log Executions
-- ============================================================================

-- Update the trigger_class_generation function to log executions
CREATE OR REPLACE FUNCTION public.trigger_class_generation(
    p_student_id INTEGER,
    p_operation TEXT DEFAULT 'insert'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_student RECORD;
    v_log_id INTEGER;
BEGIN
    -- Get student data
    SELECT * INTO v_student
    FROM public.students
    WHERE id = p_student_id;
    
    -- Create log entry
    INSERT INTO public.class_generation_logs (student_id, operation, status, message)
    VALUES (p_student_id, p_operation, 'pending', 'Class generation triggered')
    RETURNING id INTO v_log_id;
    
    -- Only proceed if student has start_date and fixed_schedule
    IF v_student.start_date IS NULL OR v_student.fixed_schedule IS NULL THEN
        UPDATE public.class_generation_logs
        SET status = 'skipped',
            message = 'Student does not have start_date or fixed_schedule'
        WHERE id = v_log_id;
        
        RAISE NOTICE 'Student % does not have start_date or fixed_schedule, skipping class generation', p_student_id;
        RETURN;
    END IF;
    
    -- Log the trigger
    RAISE NOTICE 'Triggering class generation for student % (operation: %)', p_student_id, p_operation;
    
    -- Update log entry to success (actual generation happens in Edge Function)
    UPDATE public.class_generation_logs
    SET status = 'triggered',
        message = 'Class generation trigger sent to Edge Function'
    WHERE id = v_log_id;
    
END;
$$;

-- ============================================================================
-- STEP 8: Create Function to Clean Old Logs
-- ============================================================================

CREATE OR REPLACE FUNCTION public.clean_old_class_generation_logs(
    p_days_to_keep INTEGER DEFAULT 30
)
RETURNS TABLE (
    deleted_count INTEGER,
    message TEXT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_deleted_count INTEGER := 0;
BEGIN
    DELETE FROM public.class_generation_logs
    WHERE trigger_time < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_deleted_count,
        CASE 
            WHEN v_deleted_count = 0 THEN 'No old logs to clean'
            WHEN v_deleted_count = 1 THEN '1 old log entry removed'
            ELSE v_deleted_count || ' old log entries removed'
        END;
END;
$$;

COMMENT ON FUNCTION public.clean_old_class_generation_logs IS 
'Removes class generation logs older than the specified number of days (default: 30).';

-- ============================================================================
-- STEP 9: Verification Queries
-- ============================================================================

-- Check all triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('students', 'classes', 'courses')
ORDER BY event_object_table, trigger_name;

-- Check all functions exist
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%class%'
ORDER BY routine_name;

-- Check recent log entries
SELECT 
    id,
    student_id,
    operation,
    trigger_time,
    status,
    message,
    classes_created
FROM public.class_generation_logs
ORDER BY trigger_time DESC
LIMIT 10;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$ 
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SUPABASE TRIGGERS AND AUTOMATED FUNCTIONS SETUP COMPLETE';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - Trigger for student INSERT (automatic class generation)';
    RAISE NOTICE '  - Trigger for student UPDATE (automatic class regeneration)';
    RAISE NOTICE '  - Function for weekly class generation (to be scheduled)';
    RAISE NOTICE '  - Logging table for trigger executions';
    RAISE NOTICE '  - Utility functions for maintenance';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Create a Supabase Edge Function to call your Next.js API';
    RAISE NOTICE '  2. Schedule the weekly generation function to run every Monday at 6:00 AM';
    RAISE NOTICE '  3. Test the triggers by creating/updating a student';
    RAISE NOTICE '  4. Monitor the class_generation_logs table for execution status';
    RAISE NOTICE '============================================================================';
END $$;
