
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Use relative paths to avoid alias issues if not configured in runner
import { getServiceSupabase } from '../lib/supabase';
import { stripe } from '../lib/stripe';

async function verifyBackend() {
    console.log('\n🔌 Backend Connectivity Verification\n');
    console.log('='.repeat(50));

    // 1. Supabase Check
    console.log('\n🗄️  Checking Supabase Connection...');
    const supabase = getServiceSupabase();
    const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!sbUrl || !sbKey) {
        console.error('❌ Supabase Env Vars missing');
    } else {
        console.log(`   URL: ${sbUrl.substring(0, 20)}...`);

        try {
            // Using 'screenings' table - assuming it exists from migration
            // We use select count just to check permissions and existence
            const { count, error } = await supabase
                .from('screenings')
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.error(`❌ Connection Failed: ${error.message}`);
                if (error.code === '42P01') {
                    console.error('   Hint: Table "screenings" does not exist. Did you run the migration?');
                }
            } else {
                console.log('✅ Connection Successful');
                console.log(`   Table "screenings" found (Row count: ${count})`);
            }
        } catch (err: any) {
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
            // List products is a simple read op
            const products = await stripe.products.list({ limit: 1 });
            console.log('✅ Connection Successful');
            console.log(`   Retrieved ${products.data.length} products`);
        } catch (err: any) {
            console.error(`❌ Connection Failed: ${err.message}`);
        }
    }
    console.log('\n' + '='.repeat(50) + '\n');
}

verifyBackend().catch(console.error);
