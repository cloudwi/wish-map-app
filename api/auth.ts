import apiClient from './client';
import { TokenResponse, User } from '../types';

export const authApi = {
  requestPhoneCode: async (phone: string): Promise<void> => {
    await apiClient.post('/auth/phone/request', { phone });
  },

  verifyPhoneCode: async (phone: string, code: string): Promise<TokenResponse> =>
    (await apiClient.post<TokenResponse>('/auth/phone/verify', { phone, code })).data,

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

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/me');
  },

};
