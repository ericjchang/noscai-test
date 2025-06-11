import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, LoginCredentials } from '../types';
import * as api from '../services/api';
import { webSocketService } from '../services/websocket';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(credentials);
          const { user, token } = response;

          localStorage.setItem('authToken', token);
          set({ user, token, isLoading: false });

          await webSocketService.connect(token);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Login failed';
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await api.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('authToken');
          webSocketService.disconnect();
          set({ user: null, token: null, isLoading: false, error: null });
        }
      },

      loadUser: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        set({ isLoading: true });
        try {
          const user = await api.getProfile();
          set({ user, token, isLoading: false });

          await webSocketService.connect(token);
        } catch (error) {
          localStorage.removeItem('authToken');
          set({ user: null, token: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
