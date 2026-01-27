import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'EMPLOYEE';
  companyId?: string;
  companyName?: string;
  subdomain?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  companyId: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, companyId?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      companyId: null,
      isAuthenticated: false,
      setAuth: (user, token, companyId) => {
        localStorage.setItem('token', token);
        if (companyId) {
          localStorage.setItem('companyId', companyId);
        }
        set({ user, token, companyId, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('companyId');
        set({ user: null, token: null, companyId: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

