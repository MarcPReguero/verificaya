#!/usr/bin/env node

/**
 * Script to create the 'reports' Storage bucket in Supabase
 * Run this script once to set up PDF storage
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  console.log('🚀 Creating Supabase Storage bucket for PDF reports...\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      process.exit(1);
    }

    const bucketExists = buckets.find(b => b.name === 'reports');

    if (bucketExists) {
      console.log('✅ Bucket "reports" already exists!');
      console.log('📋 Bucket details:');
      console.log('   - Name:', bucketExists.name);
      console.log('   - Public:', bucketExists.public);
      console.log('   - Created:', bucketExists.created_at);
      console.log('\n✨ No action needed - bucket is ready to use!');
      return;
    }

    // Create the bucket
    console.log('📦 Creating new bucket "reports"...');
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('reports', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf']
    });

    if (createError) {
      console.error('❌ Error creating bucket:', createError);
      process.exit(1);
    }

    console.log('✅ SUCCESS! Storage bucket created!');
    console.log('\n📋 Bucket configuration:');
    console.log('   - Name: reports');
    console.log('   - Public: Yes (PDFs are publicly accessible)');
    console.log('   - Max file size: 10MB');
    console.log('   - Allowed types: PDF only');
    console.log('\n✨ Your PDF report system is now ready!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create a screening');
    console.log('   2. Complete payment');
    console.log('   3. PDF will be generated and stored in this bucket');
    console.log('   4. View PDF from dashboard');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
createStorageBucket();
