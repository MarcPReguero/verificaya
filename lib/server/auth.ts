import { createClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const stripWhitespace = (value: string | undefined): string => (value || '').trim();

const isPlaceholder = (value: string, placeholders: string[]): boolean => {
  const normalized = value.toLowerCase();
  return placeholders.some((placeholder) => normalized === placeholder.toLowerCase());
};

const isSupabaseClientConfigured = (): boolean => {
  const supabaseUrl = stripWhitespace(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = stripWhitespace(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!supabaseUrl || !supabaseAnonKey) {
    return false;
  }

  if (isPlaceholder(supabaseUrl, ['your_supabase_url'])) {
    return false;
  }

  if (isPlaceholder(supabaseAnonKey, ['your_supabase_anon_key'])) {
    return false;
  }

  return true;
};

const getSupabaseClientEnv = (): { url: string; anonKey: string } | null => {
  if (!isSupabaseClientConfigured()) {
    return null;
  }

  return {
    url: stripWhitespace(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: stripWhitespace(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
};

const extractBearerToken = (request: NextRequest): string | null => {
  const authHeader = stripWhitespace(request.headers.get('authorization') || undefined);
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice('bearer '.length).trim();
    return token || null;
  }
  return null;
};

const extractAccessToken = (request: NextRequest): string | null => {
  const headerToken = extractBearerToken(request);
  if (headerToken) {
    return headerToken;
  }

  const cookieToken = stripWhitespace(request.cookies.get('sb-access-token')?.value);
  return cookieToken || null;
};

const buildSupabaseClient = (accessToken?: string) => {
  const env = getSupabaseClientEnv();
  if (!env) {
    return null;
  }

  const options: {
    auth: {
      autoRefreshToken: boolean;
      persistSession: boolean;
    };
    global?: {
      headers: {
        Authorization: string;
      };
    };
  } = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };

  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
  }

  return createClient(env.url, env.anonKey, options);
};

export interface RequestAuth {
  user: User;
  accessToken: string;
}

export const createUserSupabaseClient = (accessToken: string) => {
  return buildSupabaseClient(accessToken);
};

export const authenticateRequest = async (
  request: NextRequest
): Promise<RequestAuth | null> => {
  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return null;
  }

  const supabase = buildSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(accessToken);
  if (error || !data.user || !data.user.email) {
    return null;
  }

  return {
    user: data.user,
    accessToken,
  };
};
