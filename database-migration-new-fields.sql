-- Database Migration: Add New Scoring Algorithm Fields
-- Run this in your Supabase SQL Editor
-- Created: 2025-10-18

-- ================================================================
-- PART 1: Add Employment Stability Fields
-- ================================================================

-- Add employment years (decimal to support 2.5 years, etc.)
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS employment_years DECIMAL(4,1);

-- Add contract type (Spanish labor law specific)
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS contract_type VARCHAR(20)
CHECK (contract_type IN ('indefinido', 'temporal', 'autonomo', 'other') OR contract_type IS NULL);

-- Add employer name
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS employer_name VARCHAR(255);

-- Add industry sector (for future ML features)
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS industry_sector VARCHAR(100);

COMMENT ON COLUMN screenings.employment_years IS 'Years at current job (e.g., 2.5 for 2 years 6 months)';
COMMENT ON COLUMN screenings.contract_type IS 'Spanish contract type: indefinido, temporal, autonomo, other';
COMMENT ON COLUMN screenings.employer_name IS 'Current employer company name';

-- ================================================================
-- PART 2: Add References (JSONB Array)
-- ================================================================

-- Add references as JSONB array
-- Note: "references" is a reserved keyword in PostgreSQL, so we must quote it
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS "references" JSONB;

COMMENT ON COLUMN screenings."references" IS 'Array of references: [{type: employer|previous_landlord|personal, name, phone, email, relationship, verified, verifiedAt}]';

-- ================================================================
-- PART 3: Add Rental History Fields
-- ================================================================

ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS previous_address VARCHAR(500);

ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS previous_landlord_name VARCHAR(255);

ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS previous_landlord_phone VARCHAR(20);

ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS reason_for_moving VARCHAR(500);

ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS years_at_previous_address DECIMAL(3,1);

COMMENT ON COLUMN screenings.previous_address IS 'Previous rental address';
COMMENT ON COLUMN screenings.previous_landlord_name IS 'Previous landlord name for reference';

-- ================================================================
-- PART 4: Add New Scoring Algorithm Results
-- ================================================================

-- Add risk level classification
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20)
CHECK (risk_level IN ('low', 'medium', 'high', 'very_high') OR risk_level IS NULL);

-- Add fraud flags (JSONB array)
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS fraud_flags JSONB;

-- Add GDPR-compliant explanation (JSONB object)
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS explanation JSONB;

-- Add human review flag
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS human_review_available BOOLEAN DEFAULT true;

COMMENT ON COLUMN screenings.risk_level IS 'Risk classification: low, medium, high, very_high';
COMMENT ON COLUMN screenings.fraud_flags IS 'Array of detected fraud flags: [{type, severity, description}]';
COMMENT ON COLUMN screenings.explanation IS 'GDPR Art. 22 explanation: {topPositiveFactors, topNegativeFactors, improvementSuggestions}';
COMMENT ON COLUMN screenings.human_review_available IS 'GDPR Art. 22(3) - tenant can request human review';

-- ================================================================
-- PART 5: Add Landlord Email for Easier Querying
-- ================================================================

-- Add landlord_email for direct filtering (denormalized for performance)
ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS landlord_email VARCHAR(255);

-- Create index for faster dashboard queries
CREATE INDEX IF NOT EXISTS idx_screenings_landlord_email
ON screenings(landlord_email);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_screenings_status
ON screenings(status);

-- Composite index for common dashboard query
CREATE INDEX IF NOT EXISTS idx_screenings_landlord_status_date
ON screenings(landlord_email, status, created_at DESC);

COMMENT ON COLUMN screenings.landlord_email IS 'Denormalized for performance - avoid joins on dashboard queries';

-- ================================================================
-- PART 6: Add Demo Flag
-- ================================================================

ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_screenings_is_demo
ON screenings(is_demo);

COMMENT ON COLUMN screenings.is_demo IS 'Flag for demo/test screenings';

-- ================================================================
-- PART 7: Add Completed At Timestamp
-- ================================================================

ALTER TABLE screenings
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_screenings_completed_at
ON screenings(completed_at);

COMMENT ON COLUMN screenings.completed_at IS 'When the screening was completed';

-- ================================================================
-- VERIFICATION QUERIES
-- ================================================================

-- Verify all columns were added
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'screenings'
  AND column_name IN (
    'employment_years',
    'contract_type',
    'employer_name',
    'references',
    'previous_address',
    'previous_landlord_name',
    'risk_level',
    'fraud_flags',
    'explanation',
    'landlord_email',
    'is_demo',
    'completed_at'
  )
ORDER BY column_name;

-- Verify indexes were created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'screenings'
  AND indexname LIKE 'idx_screenings_%'
ORDER BY indexname;

-- ================================================================
-- SAMPLE DATA UPDATE (Optional - for testing)
-- ================================================================

-- Backfill landlord_email for existing records
-- UPDATE screenings s
-- SET landlord_email = l.email
-- FROM landlords l
-- WHERE s.landlord_id = l.id
--   AND s.landlord_email IS NULL;

-- ================================================================
-- ROLLBACK SCRIPT (Keep commented - only use if needed)
-- ================================================================

/*
-- WARNING: This will delete all the new columns and data!
-- Only run this if you need to rollback the migration

ALTER TABLE screenings DROP COLUMN IF EXISTS employment_years;
ALTER TABLE screenings DROP COLUMN IF EXISTS contract_type;
ALTER TABLE screenings DROP COLUMN IF EXISTS employer_name;
ALTER TABLE screenings DROP COLUMN IF EXISTS industry_sector;
ALTER TABLE screenings DROP COLUMN IF EXISTS "references";
ALTER TABLE screenings DROP COLUMN IF EXISTS previous_address;
ALTER TABLE screenings DROP COLUMN IF EXISTS previous_landlord_name;
ALTER TABLE screenings DROP COLUMN IF EXISTS previous_landlord_phone;
ALTER TABLE screenings DROP COLUMN IF EXISTS reason_for_moving;
ALTER TABLE screenings DROP COLUMN IF EXISTS years_at_previous_address;
ALTER TABLE screenings DROP COLUMN IF EXISTS risk_level;
ALTER TABLE screenings DROP COLUMN IF EXISTS fraud_flags;
ALTER TABLE screenings DROP COLUMN IF EXISTS explanation;
ALTER TABLE screenings DROP COLUMN IF EXISTS human_review_available;
ALTER TABLE screenings DROP COLUMN IF EXISTS landlord_email;
ALTER TABLE screenings DROP COLUMN IF EXISTS is_demo;
ALTER TABLE screenings DROP COLUMN IF EXISTS completed_at;

DROP INDEX IF EXISTS idx_screenings_landlord_email;
DROP INDEX IF EXISTS idx_screenings_status;
DROP INDEX IF EXISTS idx_screenings_landlord_status_date;
DROP INDEX IF EXISTS idx_screenings_is_demo;
DROP INDEX IF EXISTS idx_screenings_completed_at;
*/

-- ================================================================
-- MIGRATION COMPLETE
-- ================================================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify all columns exist using the verification query
-- 3. Test creating a new screening from the frontend
-- 4. Check that new fields appear in database
-- ================================================================
