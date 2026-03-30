import apiClient from './client';

export interface BlockedUserResponse {
  id: number;
  userId: number;
  nickname: string;
  profileImage: string | null;
  blockedAt: string;
}

export const blockApi = {
  block: async (userId: number): Promise<BlockedUserResponse> => {
    const response = await apiClient.post<BlockedUserResponse>(`/users/${userId}/block`);
    return response.data;
  },

  unblock: async (userId: number): Promise<void> => {
    await apiClient.delete(`/users/${userId}/block`);
  },

  getBlockedUsers: async (): Promise<BlockedUserResponse[]> => {
    const response = await apiClient.get<BlockedUserResponse[]>('/blocked-users');
    return response.data;
  },
};
