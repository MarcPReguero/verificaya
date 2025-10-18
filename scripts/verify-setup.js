#!/usr/bin/env node

/**
 * VerificaYa Setup Verification Script
 *
 * This script checks if your environment is properly configured
 * Run with: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 VerificaYa Setup Verification\n');
console.log('=' .repeat(60));

let errors = [];
let warnings = [];
let passed = 0;
let total = 0;

function check(name, condition, errorMsg, warningMsg = null) {
  total++;
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else if (warningMsg) {
    console.log(`⚠️  ${name} - ${warningMsg}`);
    warnings.push(warningMsg);
  } else {
    console.log(`❌ ${name} - ${errorMsg}`);
    errors.push(errorMsg);
  }
}

console.log('\n📁 File Structure Checks\n');

check(
  'database-migration-new-fields.sql exists',
  fs.existsSync('./database-migration-new-fields.sql'),
  'Missing database-migration-new-fields.sql - critical migration file not found'
);

check(
  'supabase-schema.sql exists',
  fs.existsSync('./supabase-schema.sql'),
  'Missing supabase-schema.sql - base schema not found'
);

check(
  'supabase-storage-setup.sql exists',
  fs.existsSync('./supabase-storage-setup.sql'),
  'Missing supabase-storage-setup.sql - storage policies not found'
);

check(
  '.env.example exists',
  fs.existsSync('./.env.example'),
  'Missing .env.example template'
);

console.log('\n🔐 Environment Variables\n');

// Check if .env.local exists
const envPath = './.env.local';
const hasEnvFile = fs.existsSync(envPath);

check(
  '.env.local file exists',
  hasEnvFile,
  'No .env.local file found. Copy .env.example to .env.local and fill in your values',
  '.env.local not found - app will run in demo mode'
);

if (hasEnvFile) {
  const envContent = fs.readFileSync(envPath, 'utf-8');

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ];

  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(`${varName}=`) &&
                   !envContent.includes(`${varName}=your_`) &&
                   !envContent.includes(`${varName}=xxx`);

    check(
      `${varName} is set`,
      hasVar,
      `${varName} not configured or using placeholder value`
    );
  });

  // Check Stripe key format
  if (envContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_')) {
    const isTest = envContent.includes('pk_test_');
    const isLive = envContent.includes('pk_live_');

    if (isTest) {
      console.log('ℹ️  Using Stripe TEST mode (pk_test_)');
    } else if (isLive) {
      console.log('🔴 Using Stripe LIVE mode (pk_live_) - real payments enabled!');
    }
  }
}

console.log('\n📦 Dependencies\n');

const packageJsonPath = './package.json';
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  const requiredDeps = {
    '@supabase/supabase-js': '2.x',
    'stripe': '19.x',
    'jspdf': '3.x',
    'zod': '4.x',
    'next': '15.x',
  };

  Object.entries(requiredDeps).forEach(([dep, version]) => {
    const installed = packageJson.dependencies?.[dep];
    check(
      `${dep} installed`,
      !!installed,
      `Missing dependency: ${dep}. Run npm install`,
      installed ? `Version: ${installed}` : null
    );
  });
} else {
  errors.push('package.json not found!');
}

console.log('\n🗄️  Database Migration Files\n');

// Check migration file contents
const migrationPath = './database-migration-new-fields.sql';
if (fs.existsSync(migrationPath)) {
  const migrationContent = fs.readFileSync(migrationPath, 'utf-8');

  const criticalFields = [
    'employment_years',
    'contract_type',
    'references',
    'risk_level',
    'fraud_flags',
    'explanation',
    'landlord_email',
  ];

  criticalFields.forEach(field => {
    check(
      `Migration includes ${field}`,
      migrationContent.includes(field),
      `Migration missing critical field: ${field}`
    );
  });

  // Check for indexes
  check(
    'Performance indexes defined',
    migrationContent.includes('CREATE INDEX') &&
    migrationContent.includes('idx_screenings_landlord_email'),
    'Missing performance indexes in migration'
  );
}

console.log('\n🔧 Code Quality Checks\n');

// Check if env.ts exists
check(
  'Environment validation utility exists',
  fs.existsSync('./lib/env.ts'),
  'Missing lib/env.ts - no environment validation',
  'Environment validation not set up'
);

// Check API endpoints
const apiEndpoints = [
  './app/api/screenings/route.ts',
  './app/api/screenings/[id]/process/route.ts',
  './app/api/webhooks/stripe/route.ts',
];

apiEndpoints.forEach(endpoint => {
  const exists = fs.existsSync(endpoint);
  check(
    `${path.basename(path.dirname(endpoint))}/${path.basename(endpoint)} exists`,
    exists,
    `Missing API endpoint: ${endpoint}`
  );

  if (exists) {
    const content = fs.readFileSync(endpoint, 'utf-8');

    // Check for error handling
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    check(
      `${path.basename(endpoint)} has error handling`,
      hasErrorHandling,
      `${endpoint} missing try-catch blocks`,
      'Some endpoints lack error handling'
    );
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed}/${total} checks passed\n`);

if (errors.length > 0) {
  console.log('🚨 ERRORS (must fix):\n');
  errors.forEach((err, i) => {
    console.log(`  ${i + 1}. ${err}`);
  });
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS (recommended to fix):\n');
  warnings.forEach((warn, i) => {
    console.log(`  ${i + 1}. ${warn}`);
  });
  console.log('');
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed! Ready for deployment.\n');
  console.log('Next steps:');
  console.log('  1. Run database migrations in Supabase SQL Editor');
  console.log('  2. Create storage buckets in Supabase Dashboard');
  console.log('  3. Configure Stripe webhook');
  console.log('  4. Deploy to Netlify/Vercel');
  console.log('\nSee DEPLOYMENT-GUIDE.md for detailed instructions.\n');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('⚠️  Setup incomplete but can proceed with warnings.\n');
  console.log('See DEPLOYMENT-GUIDE.md for detailed instructions.\n');
  process.exit(0);
} else {
  console.log('❌ Setup incomplete. Fix errors before deploying.\n');
  console.log('See DEPLOYMENT-GUIDE.md for help.\n');
  process.exit(1);
}
