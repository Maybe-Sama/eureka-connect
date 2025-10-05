-- Migration: Add Payment Fields to Classes Table
-- This migration adds payment_status and payment_notes fields to the classes table
-- to support payment tracking for individual classes

-- ========================================
-- ADD PAYMENT FIELDS TO CLASSES TABLE
-- ========================================
-- This migration adds the missing payment fields that are expected by the frontend
-- and used in the class generation function

-- For SQLite (local development)
ALTER TABLE classes ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
ALTER TABLE classes ADD COLUMN payment_notes TEXT DEFAULT '';
ALTER TABLE classes ADD COLUMN payment_date TEXT DEFAULT NULL;

-- For PostgreSQL/Supabase (production)
-- ALTER TABLE classes ADD COLUMN payment_status TEXT DEFAULT 'unpaid';
-- ALTER TABLE classes ADD COLUMN payment_notes TEXT DEFAULT '';
-- ALTER TABLE classes ADD COLUMN payment_date TEXT DEFAULT NULL;

-- ========================================
-- UPDATE EXISTING RECORDS
-- ========================================
-- Set default values for existing classes
UPDATE classes SET payment_status = 'unpaid' WHERE payment_status IS NULL;
UPDATE classes SET payment_notes = '' WHERE payment_notes IS NULL;

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================
-- Add indexes for payment-related queries
CREATE INDEX IF NOT EXISTS idx_classes_payment_status ON classes(payment_status);
CREATE INDEX IF NOT EXISTS idx_classes_payment_date ON classes(payment_date);

-- ========================================
-- VERIFICATION QUERIES
-- ========================================
-- Use these queries to verify the migration was successful:

-- 1. Check if the new columns were added
-- PRAGMA table_info(classes);

-- 2. Verify default values were set correctly
-- SELECT COUNT(*) as total_classes, 
--        COUNT(CASE WHEN payment_status = 'unpaid' THEN 1 END) as unpaid_classes,
--        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_classes
-- FROM classes;

-- 3. Check for any NULL values in payment_status
-- SELECT COUNT(*) as null_payment_status FROM classes WHERE payment_status IS NULL;

-- ========================================
-- NOTES
-- ========================================
-- This migration adds:
-- - payment_status: 'unpaid' | 'paid' - tracks payment status of each class
-- - payment_notes: TEXT - additional notes about payment
-- - payment_date: TEXT - date when payment was received (YYYY-MM-DD format)
--
-- The fields are used by:
-- - generateClassesFromStartDate() function to set default values
-- - ClassItem component for editing payment status
-- - Class tracking dashboard for payment statistics
-- - Invoice generation for paid classes
--
-- Default values:
-- - payment_status: 'unpaid' (for new classes)
-- - payment_notes: '' (empty string)
-- - payment_date: NULL (set when payment is received)
