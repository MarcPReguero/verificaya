/**
 * Environment Variable Validation and Type Safety
 *
 * This file validates all required environment variables at build/runtime
 * and provides type-safe access to them throughout the application.
 */

import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL').min(1),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'Supabase service role key is required'),

  // Stripe
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string()
    .min(1, 'Stripe publishable key is required')
    .refine(
      (key) => key.startsWith('pk_test_') || key.startsWith('pk_live_'),
      'Stripe publishable key must start with pk_test_ or pk_live_'
    ),
  STRIPE_SECRET_KEY: z.string()
    .min(1, 'Stripe secret key is required')
    .refine(
      (key) => key.startsWith('sk_test_') || key.startsWith('sk_live_'),
      'Stripe secret key must start with sk_test_ or sk_live_'
    ),
  STRIPE_WEBHOOK_SECRET: z.string()
    .min(1, 'Stripe webhook secret is required')
    .refine(
      (key) => key.startsWith('whsec_'),
      'Stripe webhook secret must start with whsec_'
    ),

  // Application
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid app URL').min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional
  GOOGLE_CLOUD_VISION_API_KEY: z.string().optional(),
  ASNEF_API_KEY: z.string().optional(),
  ASNEF_API_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables
 * Throws an error if validation fails
 */
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NODE_ENV: process.env.NODE_ENV,
      GOOGLE_CLOUD_VISION_API_KEY: process.env.GOOGLE_CLOUD_VISION_API_KEY,
      ASNEF_API_KEY: process.env.ASNEF_API_KEY,
      ASNEF_API_URL: process.env.ASNEF_API_URL,
      SENTRY_DSN: process.env.SENTRY_DSN,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        return `❌ ${err.path.join('.')}: ${err.message}`;
      });

      console.error('\n🚨 Environment Variable Validation Failed!\n');
      console.error('Missing or invalid environment variables:\n');
      missingVars.forEach((msg) => console.error(msg));
      console.error('\n📝 Please check your .env.local file');
      console.error('📄 See .env.example for required variables\n');

      throw new Error('Invalid environment variables');
    }
    throw error;
  }
}

/**
 * Checks if environment is configured (for demo mode fallback)
 */
export function isEnvConfigured(): boolean {
  const requiredVars = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    process.env.STRIPE_SECRET_KEY,
  ];

  return requiredVars.every(
    (v) => v && v !== '' && !v.includes('your_') && !v.includes('xxx')
  );
}

/**
 * Get environment variable with validation
 * Safe to use in both client and server components
 */
export function getEnv(key: keyof Env): string | undefined {
  if (typeof window !== 'undefined') {
    // Client-side: only NEXT_PUBLIC_ vars are available
    if (!key.startsWith('NEXT_PUBLIC_')) {
      console.warn(`Attempted to access server-only env var "${key}" on client`);
      return undefined;
    }
  }

  return env[key];
}

// Validate and export environment variables
// Only validate in production or when explicitly enabled
let env: Env;

if (process.env.NODE_ENV === 'production' || process.env.VALIDATE_ENV === 'true') {
  env = validateEnv();
} else {
  // In development, allow missing vars for easier local setup
  env = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
    GOOGLE_CLOUD_VISION_API_KEY: process.env.GOOGLE_CLOUD_VISION_API_KEY,
    ASNEF_API_KEY: process.env.ASNEF_API_KEY,
    ASNEF_API_URL: process.env.ASNEF_API_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
  };
}

export { env };

/**
 * Usage Examples:
 *
 * import { env, isEnvConfigured } from '@/lib/env';
 *
 * // Check if configured
 * if (!isEnvConfigured()) {
 *   console.log('Running in demo mode');
 * }
 *
 * // Access validated env vars
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 * const stripeKey = env.STRIPE_SECRET_KEY;
 */
