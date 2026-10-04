import { apiClient } from './client';

export interface PartyMember {
  id: number;
  userId: number;
  nickname: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';
}

export interface Party {
  myStatus?: 'HOST' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | null;
  id: number;
  title: string;
  description: string;
  category: string;
  venueName: string;
  venueAddress: string;
  latitude: number;
  longitude: number;
  startsAt: string;
  capacity: number;
  participantCount: number;
  status: 'OPEN' | 'CANCELLED';
  hostId: number | null;
  hostNickname: string;
  members: PartyMember[];
}

export interface CreatePartyInput {
  title: string;
  description: string;
  category: string;
  venueName: string;
  venueAddress: string;
  latitude: number;
  longitude: number;
  startsAt: string;
  capacity: number;
}

export interface PartyListOptions {
  category?: string;
  startsBefore?: string;
  availableOnly?: boolean;
  limit?: number;
  page?: number;
}

export const partyApi = {
  mine: async (page = 0): Promise<Party[]> => (await apiClient.get<Party[]>('/parties/mine', { params: { page, limit: 50 } })).data,
  list: async (query = '', options: PartyListOptions = {}): Promise<Party[]> =>
    (await apiClient.get<Party[]>('/parties', { params: { query, ...options } })).data,
  detail: async (id: number): Promise<Party> => (await apiClient.get<Party>(`/parties/${id}`)).data,
  create: async (input: CreatePartyInput): Promise<Party> => (await apiClient.post<Party>('/parties', input)).data,
  join: async (id: number): Promise<Party> => (await apiClient.post<Party>(`/parties/${id}/join`)).data,
  withdraw: async (id: number): Promise<Party> => (await apiClient.post<Party>(`/parties/${id}/withdraw`)).data,
  cancel: async (id: number): Promise<Party> => (await apiClient.post<Party>(`/parties/${id}/cancel`)).data,
  decide: async (id: number, memberId: number, approve: boolean): Promise<Party> =>
    (await apiClient.post<Party>(`/parties/${id}/members/${memberId}/${approve ? 'approve' : 'reject'}`)).data,
};
