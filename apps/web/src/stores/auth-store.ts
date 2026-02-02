// Auth Store - manages authentication state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole, TokenPayload } from '@/types/api';
import { api } from '@/lib/api-client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;

  // Helpers
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: () => boolean;
  isPlanner: () => boolean;
  isAgent: () => boolean;
}

// Decode JWT payload (without verification - verification done server-side)
function decodeToken(token: string): TokenPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload) return true;
  // Add 30 second buffer
  return Date.now() >= (payload.exp * 1000) - 30000;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login({ email, password });
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Login failed';
          set({ error: message, isLoading: false });
          throw err;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.logout();
        } catch {
          // Ignore logout errors
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      refreshAuth: async () => {
        try {
          const response = await api.refreshToken();
          set({
            user: response.user,
            isAuthenticated: true,
          });
        } catch {
          // Refresh failed, logout
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      checkAuth: async () => {
        const token = api.getAccessToken();
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return false;
        }

        // Check if token needs refresh
        if (isTokenExpired(token)) {
          try {
            await get().refreshAuth();
            return true;
          } catch {
            return false;
          }
        }

        // Token is valid, fetch user if not loaded
        if (!get().user) {
          try {
            const user = await api.getMe();
            set({ user, isAuthenticated: true });
          } catch {
            set({ isAuthenticated: false, user: null });
            return false;
          }
        }

        return true;
      },

      clearError: () => set({ error: null }),

      hasRole: (role: UserRole) => {
        const { user } = get();
        return user?.roleName === role;
      },

      hasPermission: (_permission: string) => {
        // TODO: Implement permission checking
        return true;
      },

      isAdmin: () => get().hasRole('admin'),
      isPlanner: () => get().hasRole('planner') || get().hasRole('admin'),
      isAgent: () => get().hasRole('agent'),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
