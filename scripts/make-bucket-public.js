#!/usr/bin/env node

/**
 * Legacy script name kept for compatibility.
 * This now hardens the "reports" bucket by forcing private mode.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function secureBucket() {
  console.log('Hardening "reports" bucket (private + PDF-only)...\n');

  try {
    const { error } = await supabase.storage.updateBucket('reports', {
      public: false,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['application/pdf'],
    });

    if (error) {
      console.error('Error updating bucket:', error);
      process.exit(1);
    }

    console.log('Success: "reports" bucket is private.');
    console.log('  - Public: false');
    console.log('  - File size limit: 10MB');
    console.log('  - Allowed MIME types: application/pdf');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

secureBucket();
