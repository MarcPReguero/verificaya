-- Migration: Add ASNEF Credit Check Fields
-- Date: 2025-10-13
-- Description: Adds fields to store ASNEF credit check results

-- Add new columns to screenings table
ALTER TABLE screenings 
ADD COLUMN IF NOT EXISTS credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 1000),
ADD COLUMN IF NOT EXISTS has_debts BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS total_debt NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS credit_checked_at TIMESTAMP WITH TIME ZONE;

-- Add comment to columns
COMMENT ON COLUMN screenings.credit_score IS 'ASNEF credit score (0-1000): 0-400=Malo, 400-600=Regular, 600-800=Bueno, 800-1000=Excelente';
COMMENT ON COLUMN screenings.has_debts IS 'Whether tenant has active debts in ASNEF';
COMMENT ON COLUMN screenings.total_debt IS 'Total amount of active debts in euros';
COMMENT ON COLUMN screenings.credit_checked_at IS 'Timestamp of ASNEF credit check';

-- Create index for credit score queries
CREATE INDEX IF NOT EXISTS idx_screenings_credit_score ON screenings(credit_score DESC);
CREATE INDEX IF NOT EXISTS idx_screenings_has_debts ON screenings(has_debts);

-- Update existing screenings to have default values
UPDATE screenings 
SET 
  has_debts = false,
  total_debt = 0
WHERE has_debts IS NULL;

SELECT 'Migration completed successfully!' as status;
