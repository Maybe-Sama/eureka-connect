-- ============================================================================
-- SUPABASE AUTHENTICATION SCHEMA MIGRATION
-- ============================================================================
-- This migration adds the necessary tables and fields for the authentication
-- system including system_users, user_sessions, and updates to students table
-- ============================================================================

-- ============================================================================
-- STEP 1: Create system_users Table
-- ============================================================================
-- This table stores all user accounts (both teachers and students)

CREATE TABLE IF NOT EXISTS public.system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK (user_type IN ('teacher', 'student')),
    student_id INTEGER UNIQUE, -- Foreign key to students table (only for student users)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_system_users_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create indices for system_users
CREATE INDEX IF NOT EXISTS idx_system_users_email ON public.system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_user_type ON public.system_users(user_type);
CREATE INDEX IF NOT EXISTS idx_system_users_student_id ON public.system_users(student_id);

COMMENT ON TABLE public.system_users IS 'Stores user accounts for teachers and students';
COMMENT ON COLUMN public.system_users.user_type IS 'Type of user: teacher or student';
COMMENT ON COLUMN public.system_users.student_id IS 'Links to students table for student users';

-- ============================================================================
-- STEP 2: Create user_sessions Table
-- ============================================================================
-- This table stores active user sessions for authentication

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES public.system_users(id) ON DELETE CASCADE
);

-- Create indices for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

COMMENT ON TABLE public.user_sessions IS 'Stores active user sessions with expiry';
COMMENT ON COLUMN public.user_sessions.session_token IS 'Unique session token for authentication';
COMMENT ON COLUMN public.user_sessions.expires_at IS 'Session expiry timestamp';

-- ============================================================================
-- STEP 3: Verify and Add Missing Columns to students Table
-- ============================================================================

DO $$ 
BEGIN
    -- Add student_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'student_code') THEN
        ALTER TABLE public.students ADD COLUMN student_code TEXT UNIQUE;
        RAISE NOTICE 'Added student_code column to students table';
    ELSE
        RAISE NOTICE 'student_code column already exists in students table';
    END IF;

    -- Add password_hash column if it doesn't exist (for student authentication)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'password_hash') THEN
        ALTER TABLE public.students ADD COLUMN password_hash TEXT;
        RAISE NOTICE 'Added password_hash column to students table';
    ELSE
        RAISE NOTICE 'password_hash column already exists in students table';
    END IF;

    -- Add start_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'start_date') THEN
        ALTER TABLE public.students ADD COLUMN start_date TEXT;
        RAISE NOTICE 'Added start_date column to students table';
    ELSE
        RAISE NOTICE 'start_date column already exists in students table';
    END IF;

    -- Add fixed_schedule column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'fixed_schedule') THEN
        ALTER TABLE public.students ADD COLUMN fixed_schedule TEXT; -- JSON as TEXT
        RAISE NOTICE 'Added fixed_schedule column to students table';
    ELSE
        RAISE NOTICE 'fixed_schedule column already exists in students table';
    END IF;

    -- Add parent_contact_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'parent_contact_type') THEN
        ALTER TABLE public.students ADD COLUMN parent_contact_type TEXT CHECK(parent_contact_type IN ('padre', 'madre', 'tutor'));
        RAISE NOTICE 'Added parent_contact_type column to students table';
    ELSE
        RAISE NOTICE 'parent_contact_type column already exists in students table';
    END IF;

    -- Add DNI column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'dni') THEN
        ALTER TABLE public.students ADD COLUMN dni TEXT;
        RAISE NOTICE 'Added dni column to students table';
    ELSE
        RAISE NOTICE 'dni column already exists in students table';
    END IF;

    -- Add NIF column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'nif') THEN
        ALTER TABLE public.students ADD COLUMN nif TEXT;
        RAISE NOTICE 'Added nif column to students table';
    ELSE
        RAISE NOTICE 'nif column already exists in students table';
    END IF;

    -- Add address column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'address') THEN
        ALTER TABLE public.students ADD COLUMN address TEXT;
        RAISE NOTICE 'Added address column to students table';
    ELSE
        RAISE NOTICE 'address column already exists in students table';
    END IF;

    -- Add postal_code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'postal_code') THEN
        ALTER TABLE public.students ADD COLUMN postal_code TEXT;
        RAISE NOTICE 'Added postal_code column to students table';
    ELSE
        RAISE NOTICE 'postal_code column already exists in students table';
    END IF;

    -- Add city column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'city') THEN
        ALTER TABLE public.students ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to students table';
    ELSE
        RAISE NOTICE 'city column already exists in students table';
    END IF;

    -- Add province column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'province') THEN
        ALTER TABLE public.students ADD COLUMN province TEXT;
        RAISE NOTICE 'Added province column to students table';
    ELSE
        RAISE NOTICE 'province column already exists in students table';
    END IF;

    -- Add country column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'students' 
                   AND column_name = 'country') THEN
        ALTER TABLE public.students ADD COLUMN country TEXT DEFAULT 'España';
        RAISE NOTICE 'Added country column to students table';
    ELSE
        RAISE NOTICE 'country column already exists in students table';
    END IF;
END $$;

-- Create indices for students table new columns
CREATE INDEX IF NOT EXISTS idx_students_student_code ON public.students(student_code);
CREATE INDEX IF NOT EXISTS idx_students_dni ON public.students(dni);
CREATE INDEX IF NOT EXISTS idx_students_nif ON public.students(nif);

-- ============================================================================
-- STEP 4: Verify invoices Table Exists with student_id
-- ============================================================================

-- Check if invoices table exists, if not create it
CREATE TABLE IF NOT EXISTS public.invoices (
    id SERIAL PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    student_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    due_date TEXT,
    status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid', 'pending', 'cancelled')),
    amount REAL NOT NULL DEFAULT 0,
    description TEXT,
    fixed_classes INTEGER DEFAULT 0,
    eventual_classes INTEGER DEFAULT 0,
    subtotal REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_invoices_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE
);

-- Create indices for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);

COMMENT ON TABLE public.invoices IS 'Stores invoices for students';
COMMENT ON COLUMN public.invoices.student_id IS 'Foreign key to students table';
COMMENT ON COLUMN public.invoices.status IS 'Invoice status: generated, sent, paid, pending, cancelled';

-- ============================================================================
-- STEP 5: Create Helper Functions for Authentication
-- ============================================================================

-- Function to validate session
CREATE OR REPLACE FUNCTION public.validate_session(token TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    user_type TEXT,
    student_id INTEGER,
    student_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        su.id as user_id,
        su.email,
        su.user_type,
        su.student_id,
        CASE 
            WHEN su.user_type = 'student' AND s.id IS NOT NULL 
            THEN s.first_name || ' ' || s.last_name
            ELSE NULL
        END as student_name
    FROM public.user_sessions us
    JOIN public.system_users su ON us.user_id = su.id
    LEFT JOIN public.students s ON su.student_id = s.id
    WHERE us.session_token = token
    AND us.expires_at > NOW();
END;
$$;

-- Function to create user session
CREATE OR REPLACE FUNCTION public.create_user_session(
    user_uuid UUID,
    session_token TEXT,
    expires_in_hours INTEGER DEFAULT 24
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    session_id UUID;
BEGIN
    INSERT INTO public.user_sessions (user_id, session_token, expires_at)
    VALUES (user_uuid, session_token, NOW() + (expires_in_hours || ' hours')::INTERVAL)
    RETURNING id INTO session_id;
    
    RETURN session_id;
END;
$$;

-- Function to create student user
CREATE OR REPLACE FUNCTION public.create_student_user(
    student_code TEXT,
    student_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_record RECORD;
    user_id UUID;
BEGIN
    -- Get student by code
    SELECT id, email, first_name, last_name INTO student_record
    FROM public.students
    WHERE students.student_code = create_student_user.student_code;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found with code: %', student_code;
    END IF;
    
    -- Check if user already exists
    SELECT id INTO user_id
    FROM public.system_users
    WHERE student_id = student_record.id;
    
    IF FOUND THEN
        RAISE EXCEPTION 'User already exists for this student';
    END IF;
    
    -- Create system user
    INSERT INTO public.system_users (email, password_hash, user_type, student_id)
    VALUES (
        student_record.email,
        student_password,
        'student',
        student_record.id
    )
    RETURNING id INTO user_id;
    
    -- Update student password_hash
    UPDATE public.students
    SET password_hash = student_password
    WHERE id = student_record.id;
    
    RETURN user_id;
END;
$$;

-- ============================================================================
-- STEP 6: Create Triggers for updated_at
-- ============================================================================

-- Trigger function to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_system_users_updated_at ON public.system_users;
CREATE TRIGGER update_system_users_updated_at
    BEFORE UPDATE ON public.system_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_invoices_updated_at ON public.invoices;
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 7: Verification Queries
-- ============================================================================

-- Check system_users table
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE '';
    
    -- Check system_users
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'system_users') THEN
        RAISE NOTICE '✅ system_users table exists';
    ELSE
        RAISE NOTICE '❌ system_users table missing';
    END IF;
    
    -- Check user_sessions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_sessions') THEN
        RAISE NOTICE '✅ user_sessions table exists';
    ELSE
        RAISE NOTICE '❌ user_sessions table missing';
    END IF;
    
    -- Check students.student_code
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'student_code') THEN
        RAISE NOTICE '✅ students.student_code column exists';
    ELSE
        RAISE NOTICE '❌ students.student_code column missing';
    END IF;
    
    -- Check students.password_hash
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'password_hash') THEN
        RAISE NOTICE '✅ students.password_hash column exists';
    ELSE
        RAISE NOTICE '❌ students.password_hash column missing';
    END IF;
    
    -- Check invoices.student_id
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'student_id') THEN
        RAISE NOTICE '✅ invoices.student_id column exists';
    ELSE
        RAISE NOTICE '❌ invoices.student_id column missing';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== END VERIFICATION ===';
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '╔═══════════════════════════════════════════════════════════════╗';
    RAISE NOTICE '║     ✅ AUTHENTICATION SCHEMA MIGRATION COMPLETED             ║';
    RAISE NOTICE '╠═══════════════════════════════════════════════════════════════╣';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  ✓ system_users table created                                ║';
    RAISE NOTICE '║  ✓ user_sessions table created                               ║';
    RAISE NOTICE '║  ✓ students table updated with auth fields                   ║';
    RAISE NOTICE '║  ✓ invoices table verified                                   ║';
    RAISE NOTICE '║  ✓ Helper functions created                                  ║';
    RAISE NOTICE '║  ✓ Indices and constraints created                           ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '║  Next steps:                                                  ║';
    RAISE NOTICE '║  1. Run supabase-rls-policies.sql for security               ║';
    RAISE NOTICE '║  2. Test authentication flow                                  ║';
    RAISE NOTICE '║  3. Register test users                                       ║';
    RAISE NOTICE '║                                                               ║';
    RAISE NOTICE '╚═══════════════════════════════════════════════════════════════╝';
    RAISE NOTICE '';
END $$;


