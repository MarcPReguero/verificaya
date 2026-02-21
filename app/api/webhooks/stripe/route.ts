import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripeClient, isStripeConfigured } from '@/lib/stripe';
import { getServiceSupabase } from '@/lib/supabase';

const isSupabaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url' &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_service_role_key'
  );
};

const toProcessMetadata = (
  metadata?: Stripe.Metadata | null
): {
  screeningId?: string;
  billingMode?: 'payperuse' | 'subscription';
  packageType?: 'basic' | 'complete';
  subscriptionPlan?: 'starter' | 'professional' | 'enterprise';
} => {
  if (!metadata) {
    return {};
  }

  const billingMode = metadata.billingMode === 'subscription' ? 'subscription' : 'payperuse';
  const packageType =
    metadata.packageType === 'basic' || metadata.packageType === 'complete'
      ? metadata.packageType
      : undefined;
  const subscriptionPlan =
    metadata.subscriptionPlan === 'starter' ||
    metadata.subscriptionPlan === 'professional' ||
    metadata.subscriptionPlan === 'enterprise'
      ? metadata.subscriptionPlan
      : undefined;

  return {
    screeningId: metadata.screeningId,
    billingMode,
    packageType,
    subscriptionPlan,
  };
};

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      console.error('Stripe is not properly configured');
      return NextResponse.json(
        { error: 'Stripe is not properly configured' },
        { status: 500 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret missing in environment');
      return NextResponse.json(
        { error: 'Webhook secret is not configured' },
        { status: 500 }
      );
    }

    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const eventType = event.type;

    if (eventType !== 'checkout.session.completed') {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = toProcessMetadata(session.metadata);
    const { screeningId, billingMode, packageType, subscriptionPlan } = metadata;

    if (!screeningId) {
      return NextResponse.json({ received: true });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        received: true,
        warning: 'Supabase not configured - skipping persistence and processing',
        screeningId,
        metadata: { billingMode, packageType, subscriptionPlan },
      });
    }

    // Ignore unpaid events and let Stripe retry when they transition.
    if (session.payment_status && session.payment_status !== 'paid') {
      return NextResponse.json({
        received: true,
        screeningId,
        ignored: true,
        reason: `payment_status=${session.payment_status}`,
      });
    }

    const supabase = getServiceSupabase();
    const { data: claimedScreening, error: claimError } = await supabase
      .from('screenings')
      .update({
        status: 'processing',
        payment_id: session.id,
      })
      .eq('id', screeningId)
      .eq('status', 'pending')
      .select('id, status')
      .maybeSingle();

    if (claimError) {
      console.error('Error claiming screening for webhook processing', claimError);
      return NextResponse.json(
        { error: 'Failed to claim screening before processing' },
        { status: 500 }
      );
    }

    if (!claimedScreening) {
      const { data: currentScreening, error: getScreeningError } = await supabase
        .from('screenings')
        .select('status')
        .eq('id', screeningId)
        .single();

      if (getScreeningError) {
        console.error('Error fetching screening status for webhook event', getScreeningError);
        if (getScreeningError.code === 'PGRST116') {
          return NextResponse.json({
            received: true,
            warning: 'Screening not found for webhook event',
            screeningId,
          });
        }

        return NextResponse.json(
          { error: 'Failed to load screening status before processing' },
          { status: 500 }
        );
      }

      if (currentScreening?.status === 'completed') {
        return NextResponse.json({
          received: true,
          screeningId,
          alreadyProcessed: true,
        });
      }

      if (currentScreening?.status === 'processing') {
        return NextResponse.json({
          received: true,
          screeningId,
          alreadyProcessing: true,
        });
      }

      return NextResponse.json({
        received: true,
        screeningId,
        warning: `Screening is in status ${currentScreening?.status} (expected pending)`,
      });
    }

    const processEndpoint = new URL(`/api/screenings/${screeningId}/process`, request.url);
    const processResponse = await fetch(processEndpoint.toString(), {
      method: 'POST',
    });

    if (!processResponse.ok) {
      const processError = await processResponse
        .text()
        .catch(() => 'Unable to read processing error');

      const { error: resetError } = await supabase
        .from('screenings')
        .update({ status: 'pending' })
        .eq('id', screeningId)
        .eq('status', 'processing');

      if (resetError) {
        console.error('Error resetting screening status after processing failure', resetError);
      }

      console.error('Screening processing failed from webhook', processError);
      return NextResponse.json(
        { error: 'Processing failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      screeningId,
      status: 'processing',
      metadata: {
        billingMode,
        packageType,
        subscriptionPlan,
        stripeSessionMode: session.mode,
      },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
