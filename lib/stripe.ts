import Stripe from 'stripe';

// Use environment variable or fallback to a placeholder for build purposes
// NOTE: Payments will NOT work with the placeholder key - add real key in production
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_51placeholder_for_build_only';

export const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-09-30.clover',
});

// Pay-per-Use Pricing (Pago por Informe)
export const PAY_PER_USE_PRICES = {
  basic: {
    amount: 59_00, // €59 in cents
    name: 'Verificación Básica',
    features: [
      'Verificación de identidad (NIE/DNI)',
      'Comprobación de ingresos',
      'Historial de empleo',
      'Informe PDF en 24h',
    ],
  },
  complete: {
    amount: 99_00, // €99 in cents
    name: 'Verificación Completa',
    features: [
      'Todo lo del plan Básico',
      'Consulta de solvencia',
      'Referencias de propietarios anteriores',
      'Verificación de documentos',
      'Informe PDF en 12h',
      'Soporte prioritario',
    ],
  },
};

// Subscription Pricing (Suscripción Mensual)
export const SUBSCRIPTION_PRICES = {
  starter: {
    amount: 49_00, // €49/mes in cents
    name: 'Starter',
    screenings: 3,
    features: [
      '3 verificaciones completas/mes',
      'Informes PDF ilimitados',
      'Dashboard de gestión',
      'Alertas por email',
      'Soporte por email',
    ],
    savings: 'Ahorra €148/mes vs pago individual',
  },
  professional: {
    amount: 129_00, // €129/mes in cents
    name: 'Professional',
    screenings: 10,
    features: [
      '10 verificaciones completas/mes',
      'Todo lo del plan Starter',
      'Verificaciones prioritarias (6h)',
      'API access',
      'Soporte telefónico',
      'Exportación de datos',
    ],
    savings: 'Ahorra €861/mes vs pago individual',
    popular: true,
  },
  enterprise: {
    amount: 299_00, // €299/mes in cents
    name: 'Enterprise',
    screenings: 30,
    features: [
      '30 verificaciones completas/mes',
      'Todo lo del plan Professional',
      'Verificaciones ultra-rápidas (2h)',
      'Account manager dedicado',
      'Integraciones personalizadas',
      'SLA garantizado',
      'Facturación personalizada',
    ],
    savings: 'Ahorra €2,671/mes vs pago individual',
  },
};

// Deprecated - kept for backwards compatibility
export const SCREENING_PRICES = {
  basic: PAY_PER_USE_PRICES.basic.amount,
  complete: PAY_PER_USE_PRICES.complete.amount,
};
