import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    email: string;
    name: string;
    role: string;
  } | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

// Demo credentials
const DEMO_USER = {
  email: 'demo',
  password: 'demo',
  name: 'Demo User',
  role: 'admin',
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      login: (email: string, password: string) => {
        if (email === DEMO_USER.email && password === DEMO_USER.password) {
          set({
            isAuthenticated: true,
            user: {
              email: DEMO_USER.email,
              name: DEMO_USER.name,
              role: DEMO_USER.role,
            },
          });
          return true;
        }
        return false;
      },
      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
        });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
