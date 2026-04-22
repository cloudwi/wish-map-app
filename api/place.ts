import axios from 'axios';
import apiClient from './client';
import {
  Place,
  PlaceDetail,
  CreatePlaceRequest,
  PageResponse,
  MapBounds,
  PriceRange,
} from '../types';

export interface ReviewSummary {
  nickname: string;
  profileImage: string | null;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface PlaceStatsResponse {
  restaurantId: number;
  visitCount: number;
  avgRating: number | null;
  visitedToday: boolean;
  priceRange: PriceRange | null;
  placeCategoryId: number | null;
  recentReviews: ReviewSummary[];
  lastVisitedAt: string | null;
}

export interface PlaceListParams {
  bounds?: MapBounds;
  category?: string;
  placeCategoryId?: number;
  search?: string;
  tags?: string[];
  sort?: 'latest' | 'visits' | 'recentVisit' | 'distance';
  userLat?: number;
  userLng?: number;
  priceRange?: PriceRange;
  page?: number;
  size?: number;
  // Keyset cursor. 기본 최신순일 때 cursorCreatedAt+cursorId, sortBy=visits일 때 cursorVisitCount+cursorId.
  cursorCreatedAt?: string;
  cursorVisitCount?: number;
  cursorId?: number;
}

export const placeApi = {
  // 장소 조회 (지도/리스트 통합)
  getPlaces: async (params: PlaceListParams = {}): Promise<PageResponse<Place>> => {
    const response = await apiClient.get<PageResponse<Place>>('/places', {
      params: {
        minLat: params.bounds?.minLat,
        maxLat: params.bounds?.maxLat,
        minLng: params.bounds?.minLng,
        maxLng: params.bounds?.maxLng,
        category: params.category || undefined,
        placeCategoryId: params.placeCategoryId || undefined,
        search: params.search || undefined,
        tags: params.tags?.length ? params.tags : undefined,
        sortBy: params.sort || undefined,
        priceRange: params.priceRange || undefined,
        userLat: params.userLat || undefined,
        userLng: params.userLng || undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
        cursorCreatedAt: params.cursorCreatedAt,
        cursorVisitCount: params.cursorVisitCount,
        cursorId: params.cursorId,
      },
    });
    return response.data;
  },

  // 맛집 상세
  getPlaceDetail: async (id: number): Promise<PlaceDetail> => {
    const response = await apiClient.get<PlaceDetail>(`/places/${id}`);
    return response.data;
  },

  // 맛집 제안
  createPlace: async (data: CreatePlaceRequest): Promise<PlaceDetail> => {
    const response = await apiClient.post<PlaceDetail>('/places', data);
    return response.data;
  },

  // 내 제안 목록
  getMyPlaces: async (page = 0, size = 20): Promise<PageResponse<Place>> => {
    const response = await apiClient.get<PageResponse<Place>>('/places/my', {
      params: { page, size },
    });
    return response.data;
  },

  // 방문인증 (미등록 장소 자동 등록 + 방문인증 + 선택적 리뷰)
  quickVisit: async (data: {
    name: string;
    lat: number;
    lng: number;
    naverPlaceId?: string;
    category?: string;
    userLat: number;
    userLng: number;
    comment?: string;
    tags?: string[];
    rating?: number;
    priceRange?: PriceRange;
    placeCategoryId?: number;
    imageUrls?: string[];
  }): Promise<{ restaurantId: number; visited: boolean; isNew: boolean }> => {
    const response = await apiClient.post<{ restaurantId: number; visited: boolean; isNew: boolean }>('/places/quick-visit', data);
    return response.data;
  },

  // 장소 통계 (방문 수, 평균 별점, 최근 리뷰)
  getPlaceStats: async (naverPlaceId: string): Promise<PlaceStatsResponse | null> => {
    try {
      const response = await apiClient.get<PlaceStatsResponse>('/places/place-stats', {
        params: { naverPlaceId },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  // 통계: 이번 주 방문 TOP3
  getWeeklyTop: async (): Promise<{ id: number; name: string; category: string | null; thumbnailImage: string | null; visitCount: number; placeCategoryId: number | null }[]> => {
    const response = await apiClient.get('/places/stats/weekly-top');
    return response.data;
  },

  // 그룹 필터: 그룹 구성원이 방문/제보한 맛집
  getGroupPlaces: async (groupId: number, bounds: MapBounds, priceRange?: PriceRange): Promise<PageResponse<Place>> => {
    const response = await apiClient.get<PageResponse<Place>>(`/groups/${groupId}/restaurants`, {
      params: {
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng,
        priceRange: priceRange || undefined,
        size: 500,
      },
    });
    return response.data;
  },
};
