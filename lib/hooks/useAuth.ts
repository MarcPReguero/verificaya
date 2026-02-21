'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, signOut as authSignOut, onAuthStateChange, User } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial user fetch
    const loadUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };

    loadUser();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await authSignOut();
    setUser(null);
    // Force full page reload to clear all state and cookies
    window.location.href = '/login';
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}
