import { create } from 'zustand';
import { User, AuthProvider, TokenResponse } from '../types';
import { authApi } from '../api/auth';
import { agreementApi } from '../api/agreement';
import { setItem, getItem, deleteItem } from '../utils/secureStorage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasAgreedToTerms: boolean;
  login: (provider: AuthProvider, accessToken: string, nickname?: string) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateNickname: (nickname: string) => Promise<void>;
  checkTermsAgreement: () => Promise<boolean>;
  setTermsAgreed: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasAgreedToTerms: false,

  login: async (provider, accessToken, nickname) => {
    try {
      set({ isLoading: true });
      const response: TokenResponse = await authApi.socialLogin(provider, accessToken, nickname);
      await setItem('accessToken', response.accessToken);
      await setItem('refreshToken', response.refreshToken);
      set({ user: response.user, isAuthenticated: true });
      await get().checkTermsAgreement();
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try { await authApi.logout(); } catch (e) { console.warn('Logout API failed:', e); }
    finally {
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
      set({ user: null, isAuthenticated: false });
    }
  },

  forceLogout: () => {
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const accessToken = await getItem('accessToken');
      const refreshToken = await getItem('refreshToken');

      if (!accessToken || !refreshToken) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      const response = await authApi.refresh(refreshToken);
      await setItem('accessToken', response.accessToken);
      await setItem('refreshToken', response.refreshToken);
      set({ user: response.user, isAuthenticated: true });
      await get().checkTermsAgreement();
      set({ isLoading: false });
    } catch (e) {
      console.warn('Auth check failed:', e);
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  updateNickname: async (nickname) => {
    const updatedUser = await authApi.updateNickname(nickname);
    set({ user: updatedUser });
  },

  checkTermsAgreement: async () => {
    try {
      const agreed = await agreementApi.check('TERMS_OF_SERVICE');
      set({ hasAgreedToTerms: agreed });
      return agreed;
    } catch {
      return false;
    }
  },

  setTermsAgreed: () => set({ hasAgreedToTerms: true }),
}));
