import { apiClient } from './client';

export interface GroupResponse {
  id: number;
  name: string;
  leaderId: number;
  leaderNickname: string;
  memberCount: number;
  isLeader: boolean;
  baseLat: number | null;
  baseLng: number | null;
  baseAddress: string | null;
  baseRadius: number | null;
}

export interface GroupDetailResponse {
  id: number;
  name: string;
  leaderId: number;
  leaderNickname: string;
  members: GroupMemberResponse[];
}

export interface GroupMemberResponse {
  id: number;
  userId: number;
  nickname: string;
  profileImage: string | null;
  role: 'LEADER' | 'MEMBER';
  joinedAt: string;
}

export const groupApi = {
  getMyGroups: async (): Promise<GroupResponse[]> => {
    const { data } = await apiClient.get('/groups');
    return data;
  },

  createGroup: async (name: string): Promise<GroupResponse> => {
    const { data } = await apiClient.post('/groups', { name });
    return data;
  },

  getGroupDetail: async (groupId: number): Promise<GroupDetailResponse> => {
    const { data } = await apiClient.get(`/groups/${groupId}`);
    return data;
  },

  inviteMember: async (groupId: number, nickname: string): Promise<GroupMemberResponse> => {
    const { data } = await apiClient.post(`/groups/${groupId}/members`, { nickname });
    return data;
  },

  kickMember: async (groupId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },

  transferLeader: async (groupId: number, newLeaderId: number): Promise<void> => {
    await apiClient.post(`/groups/${groupId}/transfer`, { newLeaderId });
  },

  leaveGroup: async (groupId: number): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/leave`);
  },

  updateLocation: async (groupId: number, baseLat: number, baseLng: number, baseAddress: string, baseRadius: number = 1000): Promise<void> => {
    await apiClient.patch(`/groups/${groupId}/location`, { baseLat, baseLng, baseAddress, baseRadius });
  },

  getInvites: async (): Promise<GroupInviteResponse[]> => {
    const { data } = await apiClient.get('/groups/invites');
    return data;
  },

  acceptInvite: async (groupId: number): Promise<void> => {
    await apiClient.patch(`/groups/${groupId}/invites/accept`);
  },

  rejectInvite: async (groupId: number): Promise<void> => {
    await apiClient.patch(`/groups/${groupId}/invites/reject`);
  },
};

export interface GroupInviteResponse {
  groupId: number;
  groupName: string;
  invitedBy: string;
  invitedAt: string;
}
