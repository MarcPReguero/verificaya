#!/usr/bin/env node

/**
 * Script to make the 'reports' bucket public
 * This allows PDFs to be downloaded via public URLs
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

async function makeBucketPublic() {
  console.log('🚀 Making "reports" bucket public...\n');

  try {
    // Update bucket to be public
    const { data, error } = await supabase.storage.updateBucket('reports', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['application/pdf']
    });

    if (error) {
      console.error('❌ Error updating bucket:', error);
      process.exit(1);
    }

    console.log('✅ SUCCESS! Bucket is now public!');
    console.log('\n📋 Updated configuration:');
    console.log('   - Name: reports');
    console.log('   - Public: Yes ✅');
    console.log('   - Max file size: 10MB');
    console.log('   - Allowed types: PDF only');
    console.log('\n✨ PDFs can now be downloaded via public URLs!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
makeBucketPublic();
