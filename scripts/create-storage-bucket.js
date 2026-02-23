#!/usr/bin/env node

/**
 * Create the "reports" storage bucket with secure defaults.
 * - private bucket
 * - PDF-only uploads
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

async function createStorageBucket() {
  console.log('Creating "reports" storage bucket with private access...\n');

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('Error listing buckets:', listError);
      process.exit(1);
    }

    const bucketExists = buckets.find((bucket) => bucket.name === 'reports');

    if (bucketExists) {
      console.log('Bucket "reports" already exists.');
      console.log('Details:');
      console.log('  - Name:', bucketExists.name);
      console.log('  - Public:', bucketExists.public);
      console.log('  - Created:', bucketExists.created_at);
      return;
    }

    const { error: createError } = await supabase.storage.createBucket('reports', {
      public: false,
      fileSizeLimit: 10485760,
      allowedMimeTypes: ['application/pdf'],
    });

    if (createError) {
      console.error('Error creating bucket:', createError);
      process.exit(1);
    }

    console.log('Success: "reports" bucket created.');
    console.log('  - Public: false');
    console.log('  - File size limit: 10MB');
    console.log('  - Allowed MIME types: application/pdf');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createStorageBucket();
