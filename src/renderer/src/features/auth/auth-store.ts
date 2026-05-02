import { create } from 'zustand';
import { authApi, getApiErrorMessage } from '@/lib/api';
import {
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  setAuthSession,
} from '@/lib/auth-storage';
import type { User } from '@/types/api';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

type AuthStatus = 'idle' | 'loading' | 'success' | 'error';

interface AuthStoreState {
  token: string | null;
  user: User | null;
  status: AuthStatus;
  error: string | null;
  hasInitialized: boolean;
  login: (input: LoginInput) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  fetchCurrentUser: () => Promise<User | null>;
  logout: () => void;
  clearError: () => void;
}

const storedToken = getAuthToken();
const storedUser = getStoredUser();

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  token: storedToken,
  user: storedUser,
  status: 'idle',
  error: null,
  hasInitialized: !storedToken,

  async login(input) {
    set({ status: 'loading', error: null });

    try {
      const authResponse = await authApi.login(input);
      setAuthSession(authResponse);
      set({
        token: authResponse.token,
        user: authResponse.user,
        status: 'success',
        error: null,
        hasInitialized: true,
      });
      return authResponse.user;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to sign in.');
      clearAuthSession();
      set({ status: 'error', error: message, user: null, token: null, hasInitialized: true });
      throw new Error(message);
    }
  },

  async register(input) {
    set({ status: 'loading', error: null });

    try {
      const authResponse = await authApi.register(input);
      setAuthSession(authResponse);
      set({
        token: authResponse.token,
        user: authResponse.user,
        status: 'success',
        error: null,
        hasInitialized: true,
      });
      return authResponse.user;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to create your account.');
      clearAuthSession();
      set({ status: 'error', error: message, user: null, token: null, hasInitialized: true });
      throw new Error(message);
    }
  },

  async fetchCurrentUser() {
    if (!get().token) {
      clearAuthSession();
      set({ user: null, token: null, status: 'idle', error: null, hasInitialized: true });
      return null;
    }

    set({ status: 'loading', error: null });

    try {
      const user = await authApi.me();
      const token = get().token;

      if (token) {
        setAuthSession({ token, user });
      }

      set({ user, status: 'success', error: null, hasInitialized: true });
      return user;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Unable to load your session.');
      clearAuthSession();
      set({ status: 'error', error: message, user: null, token: null, hasInitialized: true });
      return null;
    }
  },

  logout() {
    clearAuthSession();
    set({ token: null, user: null, status: 'idle', error: null, hasInitialized: true });
  },

  clearError() {
    set({ error: null });
  },
}));

export const useAuth = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const hasInitialized = useAuthStore((state) => state.hasInitialized);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);
  const logout = useAuthStore((state) => state.logout);
  const clearError = useAuthStore((state) => state.clearError);

  return {
    token,
    user,
    status,
    error,
    hasInitialized,
    isAuthenticated: Boolean(token && user),
    isLoading: status === 'loading',
    login,
    register,
    fetchCurrentUser,
    logout,
    clearError,
  };
};
