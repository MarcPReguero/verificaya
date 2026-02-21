import { supabase } from './supabase';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
}

/**
 * Sign up a new user
 */
export async function signUp(email: string, password: string, name: string) {
  try {
    // 1. Sign up with Supabase Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (signUpError) throw signUpError;

    // 2. Create or update landlord record using upsert
    if (authData.user) {
      const { error: landlordError } = await supabase
        .from('landlords')
        .upsert({
          id: authData.user.id,
          email: email,
          name: name,
        }, {
          onConflict: 'id',
        });

      if (landlordError) {
        console.error('Error upserting landlord record:', landlordError);
        // Continue anyway, user is created in auth
      }
    }

    // 3. Ensure cookies are set immediately
    if (authData.session && typeof window !== 'undefined') {
      const isProduction = window.location.protocol === 'https:';
      const secureFlag = isProduction ? '; Secure' : '';
      document.cookie = `sb-access-token=${authData.session.access_token}; path=/; max-age=3600; SameSite=Lax${secureFlag}`;
      document.cookie = `sb-refresh-token=${authData.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secureFlag}`;
    }

    return { user: authData.user, session: authData.session, error: null };
  } catch (error: unknown) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Error en registro',
    };
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Ensure cookies are set immediately
    if (data.session && typeof window !== 'undefined') {
      const isProduction = window.location.protocol === 'https:';
      const secureFlag = isProduction ? '; Secure' : '';
      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600; SameSite=Lax${secureFlag}`;
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secureFlag}`;
    }

    return { user: data.user, session: data.session, error: null };
  } catch (error: unknown) {
    return {
      user: null,
      session: null,
      error: error instanceof Error ? error.message : 'Error en inicio de sesión',
    };
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Get current user session with profile data
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Get landlord profile for additional data
    const { profile } = await getLandlordProfile(user.id);

    return {
      id: user.id,
      email: user.email || '',
      name: profile?.name || user.user_metadata?.name || '',
    };
  } catch {
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

/**
 * Get user's landlord profile
 */
export async function getLandlordProfile(userId: string) {
  try {
    const { data, error } = await supabase
      .from('landlords')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { profile: data, error: null };
  } catch (error: unknown) {
    return { profile: null, error: error instanceof Error ? error.message : 'Error al obtener perfil' };
  }
}
