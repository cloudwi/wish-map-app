import axios from 'axios';
import apiClient from './client';
import {
  Restaurant,
  RestaurantDetail,
  CreateRestaurantRequest,
  PageResponse,
  MapBounds,
  LikeGroup,
} from '../types';

export interface ReviewSummary {
  nickname: string;
  profileImage: string | null;
  content: string;
  createdAt: string;
}

export interface PlaceStatsResponse {
  restaurantId: number;
  visitCount: number;
  avgRating: number | null;
  visitedToday: boolean;
  recentReviews: ReviewSummary[];
}

export const restaurantApi = {
  // 지도 범위 내 맛집 목록
  getRestaurants: async (bounds: MapBounds, page = 0, size = 50): Promise<PageResponse<Restaurant>> => {
    const response = await apiClient.get<PageResponse<Restaurant>>('/restaurants', {
      params: {
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng,
        page,
        size,
      },
    });
    return response.data;
  },

  // 맛집 상세
  getRestaurantDetail: async (id: number): Promise<RestaurantDetail> => {
    const response = await apiClient.get<RestaurantDetail>(`/restaurants/${id}`);
    return response.data;
  },

  // 맛집 제안
  createRestaurant: async (data: CreateRestaurantRequest): Promise<RestaurantDetail> => {
    const response = await apiClient.post<RestaurantDetail>('/restaurants', data);
    return response.data;
  },

  // 내 제안 목록
  getMyRestaurants: async (page = 0, size = 20): Promise<PageResponse<Restaurant>> => {
    const response = await apiClient.get<PageResponse<Restaurant>>('/restaurants/my', {
      params: { page, size },
    });
    return response.data;
  },

  // 방문 인증
  verifyVisit: async (id: number, lat: number, lng: number): Promise<{ visited: boolean }> => {
    const response = await apiClient.post<{ visited: boolean }>(`/restaurants/${id}/visit`, { lat, lng });
    return response.data;
  },

  // 빠른 방문인증 (미등록 장소 자동 등록 + 방문인증 + 선택적 리뷰)
  quickVisit: async (data: {
    name: string;
    lat: number;
    lng: number;
    naverPlaceId?: string;
    category?: string;
    userLat: number;
    userLng: number;
    comment?: string;
    rating?: number;
  }): Promise<{ restaurantId: number; visited: boolean; isNew: boolean }> => {
    const response = await apiClient.post<{ restaurantId: number; visited: boolean; isNew: boolean }>('/restaurants/quick-visit', data);
    return response.data;
  },

  // 맛집 제보 (방문인증과 별도 - 리뷰/태그/사진 제출)
  suggest: async (data: {
    name: string;
    lat: number;
    lng: number;
    naverPlaceId?: string;
    category?: string;
    comment?: string;
    imageUrls?: string[];
  }): Promise<{ restaurantId: number; isNew: boolean }> => {
    const response = await apiClient.post<{ restaurantId: number; isNew: boolean }>('/restaurants/suggest', data);
    return response.data;
  },

  // --- 컬렉션 ---

  // 내 컬렉션 목록
  getCollections: async (restaurantId?: number): Promise<LikeGroup[]> => {
    const response = await apiClient.get<LikeGroup[]>('/restaurants/collections', {
      params: restaurantId ? { restaurantId } : undefined,
    });
    return response.data;
  },

  // 새 컬렉션 생성
  createCollection: async (name: string): Promise<LikeGroup> => {
    const response = await apiClient.post<LikeGroup>('/restaurants/collections', { name });
    return response.data;
  },

  // 맛집의 컬렉션 할당 변경
  updateRestaurantCollections: async (restaurantId: number, groupIds: number[]): Promise<{ isLiked: boolean; likeCount: number }> => {
    const response = await apiClient.put<{ isLiked: boolean; likeCount: number }>(`/restaurants/${restaurantId}/collections`, { groupIds });
    return response.data;
  },

  // 장소 통계 (방문 수, 평균 별점, 최근 리뷰)
  getPlaceStats: async (naverPlaceId: string): Promise<PlaceStatsResponse | null> => {
    try {
      const response = await apiClient.get<PlaceStatsResponse>('/restaurants/place-stats', {
        params: { naverPlaceId },
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  // 컬렉션 내 맛집 목록
  getCollectionRestaurants: async (groupId: number, page = 0, size = 20): Promise<PageResponse<Restaurant>> => {
    const response = await apiClient.get<PageResponse<Restaurant>>(`/restaurants/collections/${groupId}/restaurants`, {
      params: { page, size },
    });
    return response.data;
  },

  // 그룹 필터: 그룹 구성원이 방문/제보한 맛집
  getGroupRestaurants: async (groupId: number, bounds: MapBounds): Promise<PageResponse<Restaurant>> => {
    const response = await apiClient.get<PageResponse<Restaurant>>(`/groups/${groupId}/restaurants`, {
      params: { minLat: bounds.minLat, maxLat: bounds.maxLat, minLng: bounds.minLng, maxLng: bounds.maxLng, size: 50 },
    });
    return response.data;
  },
};
