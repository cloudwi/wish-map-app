import { apiClient } from './client';

export type FriendStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface UserSearchResult {
  id: number;
  nickname: string;
  profileImage: string | null;
  friendStatus: FriendStatus | null;
  friendId: number | null;
}

export interface FriendUserInfo {
  id: number;
  nickname: string;
  profileImage: string | null;
}

export interface FriendResponse {
  id: number;
  user: FriendUserInfo;
  status: FriendStatus;
  isRequester: boolean;
  createdAt: string;
}

export const friendApi = {
  searchUsers: (q: string) =>
    apiClient.get<UserSearchResult[]>('/friends/search', { params: { q } }).then(r => r.data),

  getFriends: () =>
    apiClient.get<FriendResponse[]>('/friends').then(r => r.data),

  getPendingRequests: () =>
    apiClient.get<FriendResponse[]>('/friends/requests').then(r => r.data),

  sendRequest: (userId: number) =>
    apiClient.post<FriendResponse>(`/friends/request/${userId}`).then(r => r.data),

  acceptRequest: (friendId: number) =>
    apiClient.patch<FriendResponse>(`/friends/request/${friendId}/accept`).then(r => r.data),

  rejectRequest: (friendId: number) =>
    apiClient.patch<FriendResponse>(`/friends/request/${friendId}/reject`).then(r => r.data),

  removeFriend: (friendId: number) =>
    apiClient.delete(`/friends/${friendId}`),
};
