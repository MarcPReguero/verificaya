import { NextRequest, NextResponse } from 'next/server';
import { stripe, SCREENING_PRICES } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { screeningId, packageType, landlordEmail } = body;

    const amount = SCREENING_PRICES[packageType as keyof typeof SCREENING_PRICES];

    if (!amount) {
      return NextResponse.json(
        { error: 'Invalid package type' },
        { status: 400 }
      );
    }

    // Ensure base URL doesn't have trailing slash
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://verificaya.es';

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Verificación de Inquilino - ${packageType === 'basic' ? 'Básica' : 'Completa'}`,
              description: 'Servicio profesional de screening de inquilinos',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/screening/${screeningId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/screening/new`,
      customer_email: landlordEmail,
      metadata: {
        screeningId,
        packageType,
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
