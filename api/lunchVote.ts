import { apiClient } from './client';

export interface LunchVoteRestaurantSummary {
  id: number;
  name: string;
  category: string | null;
  thumbnailImage: string | null;
  priceRange: string | null;
}

export interface LunchVoteCandidateResponse {
  id: number;
  restaurant: LunchVoteRestaurantSummary;
  addedBy: string;
  voteCount: number;
  voters: string[];
}

export interface LunchVoteResponse {
  id: number;
  groupId: number;
  title: string;
  status: 'ACTIVE' | 'CLOSED';
  deadline: string;
  createdBy: { id: number; nickname: string; profileImage: string | null };
  candidates: LunchVoteCandidateResponse[];
  myVoteCandidateId: number | null;
  totalVotes: number;
  createdAt: string;
}

export const lunchVoteApi = {
  getActiveVote: async (groupId: number): Promise<LunchVoteResponse | null> => {
    try {
      const { data } = await apiClient.get<LunchVoteResponse>(`/groups/${groupId}/lunch-vote`);
      return data;
    } catch {
      return null; // 404 = 활성 투표 없음
    }
  },

  createVote: async (groupId: number, deadline: string, candidateRestaurantIds?: number[]): Promise<LunchVoteResponse> => {
    const { data } = await apiClient.post<LunchVoteResponse>(`/groups/${groupId}/lunch-vote`, {
      deadline,
      candidateRestaurantIds: candidateRestaurantIds || [],
    });
    return data;
  },

  addCandidate: async (groupId: number, restaurantId: number): Promise<LunchVoteResponse> => {
    const { data } = await apiClient.post<LunchVoteResponse>(`/groups/${groupId}/lunch-vote/candidates`, {
      restaurantId,
    });
    return data;
  },

  castVote: async (groupId: number, candidateId: number): Promise<LunchVoteResponse> => {
    const { data } = await apiClient.post<LunchVoteResponse>(`/groups/${groupId}/lunch-vote/vote`, {
      candidateId,
    });
    return data;
  },

  retractVote: async (groupId: number): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/lunch-vote/vote`);
  },

  closeVote: async (groupId: number): Promise<LunchVoteResponse> => {
    const { data } = await apiClient.post<LunchVoteResponse>(`/groups/${groupId}/lunch-vote/close`);
    return data;
  },
};
