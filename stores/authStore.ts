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
  isCheckingTerms: boolean;
  hasSeenTutorial: boolean;
  login: (provider: AuthProvider, accessToken: string, nickname?: string) => Promise<void>;
  logout: () => Promise<void>;
  forceLogout: () => void;
  checkAuth: () => Promise<void>;
  setUser: (user: User | null) => void;
  updateNickname: (nickname: string) => Promise<void>;
  checkTermsAgreement: () => Promise<boolean>;
  setTermsAgreed: () => void;
  checkTutorialSeen: () => Promise<void>;
  setTutorialSeen: () => Promise<void>;
}

// 튜토리얼 본 여부는 유저별로 저장 — 같은 디바이스에서 다른 계정으로 로그인하면 다시 보여줘야 함.
const tutorialSeenKey = (userId: number | string) => `tutorialSeen_${userId}`;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  hasAgreedToTerms: false,
  isCheckingTerms: false,
  hasSeenTutorial: true,

  login: async (provider, accessToken, nickname) => {
    try {
      set({ isLoading: true });
      const response: TokenResponse = await authApi.socialLogin(provider, accessToken, nickname);
      await Promise.all([
        setItem('accessToken', response.accessToken),
        setItem('refreshToken', response.refreshToken),
      ]);
      set({ user: response.user, isAuthenticated: true, isLoading: false });
      console.info(`[AUTH] 로그인 성공: provider=${provider}, userId=${response.user.id}`);
      // 약관 동의 확인은 백그라운드로 수행 — (tabs)/_layout.tsx가 결과에 따라 모달 노출.
      get().checkTermsAgreement();
      get().checkTutorialSeen();
    } catch (error) {
      console.warn(`[AUTH] 로그인 실패: provider=${provider}`, error);
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const userId = get().user?.id;
    try { await authApi.logout(); } catch {}
    finally {
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
      set({ user: null, isAuthenticated: false });
      console.info(`[AUTH] 로그아웃: userId=${userId}`);
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
      await get().checkTutorialSeen();
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
    set({ isCheckingTerms: true });
    try {
      const agreed = await agreementApi.check('TERMS_OF_SERVICE');
      set({ hasAgreedToTerms: agreed, isCheckingTerms: false });
      return agreed;
    } catch {
      set({ isCheckingTerms: false });
      return false;
    }
  },

  setTermsAgreed: () => set({ hasAgreedToTerms: true }),

  checkTutorialSeen: async () => {
    const userId = get().user?.id;
    if (!userId) {
      set({ hasSeenTutorial: true });
      return;
    }
    const seen = await getItem(tutorialSeenKey(userId));
    set({ hasSeenTutorial: seen === '1' });
  },

  setTutorialSeen: async () => {
    const userId = get().user?.id;
    set({ hasSeenTutorial: true });
    if (userId) await setItem(tutorialSeenKey(userId), '1');
  },
}));
