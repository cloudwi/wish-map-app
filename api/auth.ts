import apiClient from './client';
import { AuthProvider, TokenResponse } from '../types';

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
    await apiClient.delete('/auth/logout');
  },
};
