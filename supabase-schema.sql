-- TenantScreen Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Landlords table
CREATE TABLE IF NOT EXISTS landlords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  company_name TEXT,
  nif TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screenings table
CREATE TABLE IF NOT EXISTS screenings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  landlord_id UUID REFERENCES landlords(id) ON DELETE CASCADE,
  tenant_name TEXT NOT NULL,
  tenant_email TEXT NOT NULL,
  tenant_phone TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('NIE', 'DNI', 'PASSPORT')),
  document_number TEXT NOT NULL,
  monthly_income NUMERIC NOT NULL,
  employment_status TEXT NOT NULL CHECK (employment_status IN ('employed', 'self-employed', 'student', 'unemployed')),
  property_address TEXT NOT NULL,
  monthly_rent NUMERIC NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('basic', 'complete')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  -- 🆕 ASNEF Credit Check fields
  credit_score INTEGER CHECK (credit_score >= 0 AND credit_score <= 1000),
  has_debts BOOLEAN DEFAULT false,
  total_debt NUMERIC DEFAULT 0,
  credit_checked_at TIMESTAMP WITH TIME ZONE,
  report_url TEXT,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Screening documents table
CREATE TABLE IF NOT EXISTS screening_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  screening_id UUID REFERENCES screenings(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('payslip', 'employment-contract', 'id-document', 'bank-statement', 'reference')),
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_landlords_email ON landlords(email);
CREATE INDEX IF NOT EXISTS idx_screenings_landlord_id ON screenings(landlord_id);
CREATE INDEX IF NOT EXISTS idx_screenings_status ON screenings(status);
CREATE INDEX IF NOT EXISTS idx_screenings_created_at ON screenings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screening_documents_screening_id ON screening_documents(screening_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_landlords_updated_at BEFORE UPDATE ON landlords
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_screenings_updated_at BEFORE UPDATE ON screenings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_documents ENABLE ROW LEVEL SECURITY;

-- Landlords policies
CREATE POLICY "Landlords can view their own data" ON landlords
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Anyone can insert landlords" ON landlords
  FOR INSERT WITH CHECK (true);

-- Screenings policies  
CREATE POLICY "Landlords can view their own screenings" ON screenings
  FOR SELECT USING (landlord_id IN (SELECT id FROM landlords WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Service role can do anything with screenings" ON screenings
  FOR ALL USING (true);

-- Screening documents policies
CREATE POLICY "View documents for own screenings" ON screening_documents
  FOR SELECT USING (
    screening_id IN (
      SELECT id FROM screenings WHERE landlord_id IN (
        SELECT id FROM landlords WHERE email = auth.jwt()->>'email'
      )
    )
  );

CREATE POLICY "Service role can do anything with documents" ON screening_documents
  FOR ALL USING (true);

-- Create storage buckets (run these commands separately in Supabase Dashboard > Storage)
-- 1. Create 'documents' bucket for uploaded files
-- 2. Create 'reports' bucket for PDF reports
-- 3. Set both buckets to private
-- 4. Add policies:

-- Documents bucket policy (allow authenticated uploads)
-- CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT
--   TO authenticated WITH CHECK (bucket_id = 'documents');

-- CREATE POLICY "Allow owners to view documents" ON storage.objects FOR SELECT
--   TO authenticated USING (bucket_id = 'documents');

-- Reports bucket policy (allow service role)
-- CREATE POLICY "Allow service role" ON storage.objects FOR ALL
--   TO service_role USING (bucket_id = 'reports');

-- Sample data for testing (optional)
-- INSERT INTO landlords (email, name, phone) VALUES
--   ('test@example.com', 'Test Landlord', '+34 600 000 000');

COMMENT ON TABLE landlords IS 'Property owners who order tenant screenings';
COMMENT ON TABLE screenings IS 'Tenant verification requests and results';
COMMENT ON TABLE screening_documents IS 'Documents uploaded for screening verification';
