import { NextRequest, NextResponse } from 'next/server';
import { getStripeClient, isStripeConfigured, SCREENING_PRICES, SUBSCRIPTION_PRICES } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        {
          error: 'Stripe is not properly configured',
          details: 'Missing or invalid STRIPE_SECRET_KEY in environment variables.',
        },
        { status: 503 }
      );
    }

    const stripe = getStripeClient();
    const body = await request.json();
    const {
      screeningId,
      packageType = 'complete',
      billingMode = 'payperuse',
      subscriptionPlan = 'professional',
      landlordEmail,
    } = body;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://verificaya.es';
    const normalizedBilling = billingMode === 'subscription' ? 'subscription' : 'payperuse';
    const selectedPackageType =
      packageType === 'basic' || packageType === 'complete' ? packageType : 'complete';
    const selectedPlan =
      subscriptionPlan === 'starter' || subscriptionPlan === 'professional' || subscriptionPlan === 'enterprise'
        ? subscriptionPlan
        : 'professional';

    if (!screeningId || typeof screeningId !== 'string' || !screeningId.trim()) {
      return NextResponse.json(
        { error: 'Invalid screeningId' },
        { status: 400 }
      );
    }

    if (!landlordEmail || typeof landlordEmail !== 'string' || !landlordEmail.trim()) {
      return NextResponse.json(
        { error: 'Invalid landlordEmail' },
        { status: 400 }
      );
    }

    let lineItem: {
      price_data: {
        currency: string;
        product_data: {
          name: string;
          description: string;
        };
        unit_amount: number;
        recurring?: {
          interval: 'month';
        };
      };
      quantity: number;
    };
    let mode: 'payment' | 'subscription';
    let metadata: Record<string, string>;

    if (normalizedBilling === 'subscription') {
      const plan = SUBSCRIPTION_PRICES[selectedPlan as keyof typeof SUBSCRIPTION_PRICES];

      if (!plan) {
        return NextResponse.json(
          { error: 'Invalid subscription plan' },
          { status: 400 }
        );
      }

      lineItem = {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Suscripcion ${plan.name}`,
            description: `Servicio de verificacion mensual - ${plan.screenings} verificaciones`,
          },
          unit_amount: plan.amount,
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      };

      mode = 'subscription';
      metadata = {
        billingMode: normalizedBilling,
        packageType: selectedPackageType,
        subscriptionPlan: selectedPlan,
      };
    } else {
      const amount = SCREENING_PRICES[selectedPackageType as keyof typeof SCREENING_PRICES];

      if (!amount) {
        return NextResponse.json(
          { error: 'Invalid package type' },
          { status: 400 }
        );
      }

      lineItem = {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Verificacion de Inquilino - ${selectedPackageType === 'basic' ? 'Basica' : 'Completa'}`,
            description: 'Servicio profesional de screening de inquilinos',
          },
          unit_amount: amount,
        },
        quantity: 1,
      };

      mode = 'payment';
      metadata = {
        billingMode: normalizedBilling,
        packageType: selectedPackageType,
      };
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode,
      success_url: `${baseUrl}/screening/${screeningId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/screening/new`,
      customer_email: landlordEmail,
      metadata: {
        screeningId,
        ...metadata,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Error creating payment session' },
      { status: 500 }
    );
  }
}
