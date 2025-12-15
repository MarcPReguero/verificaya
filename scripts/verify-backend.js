
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local');
console.log(`Loading env from: ${envPath}`);
dotenv.config({ path: envPath });

// Import Supabase
const { createClient } = require('@supabase/supabase-js');

// Import Stripe
const Stripe = require('stripe');

async function verifyBackend() {
    console.log('\n🔌 Backend Connectivity Verification (Node.js)\n');
    console.log('='.repeat(50));

    // 1. Supabase Check
    console.log('\n🗄️  Checking Supabase Connection...');

    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!sbUrl || !sbKey) {
        console.error('❌ Supabase Env Vars missing');
    } else {
        console.log(`   URL: ${sbUrl.substring(0, 20)}...`);

        try {
            const supabase = createClient(sbUrl, sbKey);

            // Try to select 'contract_type' to verify migration
            const { count, error } = await supabase
                .from('screenings')
                .select('id, contract_type', { count: 'exact', head: true });

            if (error) {
                console.error(`❌ Connection Failed: ${error.message}`);
                if (error.code === '42703') { // Undefined column
                    console.error('   Hint: Column "contract_type" missing. Migration NOT applied.');
                } else if (error.code === '42P01') {
                    console.error('   Hint: Table "screenings" does not exist.');
                }
            } else {
                console.log('✅ Connection Successful & Schema Valid');
                console.log(`   Table "screenings" has correct columns (Row count: ${count ?? 0})`);
            }
        } catch (err) {
            console.error(`❌ Unexpected Error: ${err.message}`);
        }
    }

    // 2. Stripe Check
    console.log('\n💳 Checking Stripe Connection...');
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
        console.error('❌ STRIPE_SECRET_KEY missing');
    } else {
        console.log(`   Key: ${stripeKey.substring(0, 8)}...`);
        try {
            const stripe = new Stripe(stripeKey, { apiVersion: '2025-09-30.clover' });
            const products = await stripe.products.list({ limit: 1 });
            console.log('✅ Connection Successful');
            console.log(`   Retrieved ${products.data.length} products`);
        } catch (err) {
            console.error(`❌ Connection Failed: ${err.message}`);
        }
    }
    console.log('\n' + '='.repeat(50) + '\n');
}

verifyBackend().catch(console.error);
