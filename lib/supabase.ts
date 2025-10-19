import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage that uses both localStorage and cookies
const customStorage = {
  getItem: (key: string) => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);

    // Also set as cookie for server-side access
    try {
      const data = JSON.parse(value);
      // Supabase stores the session in different formats, check both
      const accessToken = data?.access_token || data?.currentSession?.access_token;
      const refreshToken = data?.refresh_token || data?.currentSession?.refresh_token;

      if (accessToken) {
        // Don't use Secure flag for localhost development
        const isProduction = window.location.protocol === 'https:';
        const secureFlag = isProduction ? '; Secure' : '';
        document.cookie = `sb-access-token=${accessToken}; path=/; max-age=3600; SameSite=Lax${secureFlag}`;
      }
      if (refreshToken) {
        const isProduction = window.location.protocol === 'https:';
        const secureFlag = isProduction ? '; Secure' : '';
        document.cookie = `sb-refresh-token=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secureFlag}`;
      }
    } catch (e) {
      // If parsing fails, just store in localStorage
      console.error('Error parsing session for cookies:', e);
    }
  },
  removeItem: (key: string) => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);

    // Also remove cookies
    document.cookie = 'sb-access-token=; path=/; max-age=0';
    document.cookie = 'sb-refresh-token=; path=/; max-age=0';
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: customStorage,
  },
});

// Server-side client with service role key
export const getServiceSupabase = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return createClient(supabaseUrl, supabaseServiceKey);
};
