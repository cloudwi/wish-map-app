import apiClient from './client';
import { AuthProvider, TokenResponse, User } from '../types';

export const authApi = {
  socialLogin: async (provider: AuthProvider, accessToken: string, nickname?: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>(`/auth/${provider.toLowerCase()}`, {
      accessToken,
      nickname,
    });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<TokenResponse> => {
    const response = await apiClient.post<TokenResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  logout: async (): Promise<void> => {
    // JWT 기반이라 서버 호출 불필요, 클라이언트에서 토큰 삭제만 수행
  },

  updateNickname: async (nickname: string): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me/nickname', { nickname });
    return response.data;
  },
};
