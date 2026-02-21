import { NextResponse } from 'next/server';
import { isOpenRouterConfigured } from '@/lib/ocr/openrouter-vision';
import { isStripeConfigured, getStripeClient } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';

type ServiceStatus = 'ok' | 'misconfigured' | 'error';

const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key'
  );
};

const checkSupabase = async (): Promise<{ status: ServiceStatus; details?: string }> => {
  if (!isSupabaseConfigured()) {
    return { status: 'misconfigured', details: 'Supabase env vars missing or placeholder values' };
  }

  try {
    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('screenings')
      .select('id', { count: 'exact', head: true });

    if (error) {
      return { status: 'error', details: error.message };
    }

    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', details: (error as Error).message };
  }
};

const checkStripe = async (): Promise<{ status: ServiceStatus; details?: string }> => {
  if (!isStripeConfigured()) {
    return { status: 'misconfigured', details: 'Stripe env var missing or invalid' };
  }

  try {
    const stripe = getStripeClient();
    await stripe.products.list({ limit: 1 });

    return { status: 'ok' };
  } catch (error) {
    return { status: 'error', details: (error as Error).message };
  }
};

export async function GET() {
  const [database, stripe] = await Promise.all([checkSupabase(), checkStripe()]);

  return NextResponse.json({
    status: database.status === 'ok' && stripe.status === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    services: {
      ocr: {
        provider: 'openrouter',
        configured: isOpenRouterConfigured(),
        model: 'google/gemini-2.0-flash-exp:free',
      },
      database: {
        status: database.status,
        details: database.details,
      },
      stripe: {
        status: stripe.status,
        details: stripe.details,
      },
    },
    env: process.env.NODE_ENV,
  });
}
