import axios from 'axios';
import apiClient from './client';
import {
  Restaurant,
  RestaurantDetail,
  CreateRestaurantRequest,
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

export interface RestaurantListParams {
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
}

export const restaurantApi = {
  // 지도 범위 내 장소 목록 (지도 탭용)
  getRestaurants: async (bounds: MapBounds, priceRange?: PriceRange, placeCategoryId?: number, page = 0, size = 500): Promise<PageResponse<Restaurant>> => {
    const response = await apiClient.get<PageResponse<Restaurant>>('/restaurants', {
      params: {
        minLat: bounds.minLat,
        maxLat: bounds.maxLat,
        minLng: bounds.minLng,
        maxLng: bounds.maxLng,
        priceRange: priceRange || undefined,
        placeCategoryId: placeCategoryId || undefined,
        page,
        size,
      },
    });
    return response.data;
  },

  // 장소 리스트 (리스트 탭용 - 서버사이드 필터/검색/정렬)
  getRestaurantList: async (params: RestaurantListParams = {}): Promise<PageResponse<Restaurant>> => {
    const response = await apiClient.get<PageResponse<Restaurant>>('/restaurants', {
      params: {
        category: params.category || undefined,
        placeCategoryId: params.placeCategoryId || undefined,
        search: params.search || undefined,
        tags: params.tags?.length ? params.tags : undefined,
        sortBy: params.sort || 'latest',
        priceRange: params.priceRange || undefined,
        userLat: params.userLat || undefined,
        userLng: params.userLng || undefined,
        page: params.page ?? 0,
        size: params.size ?? 20,
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
    const response = await apiClient.post<{ restaurantId: number; visited: boolean; isNew: boolean }>('/restaurants/quick-visit', data);
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

  // 통계: 이번 주 방문 TOP3
  getWeeklyTop: async (): Promise<{ id: number; name: string; category: string | null; thumbnailImage: string | null; visitCount: number; placeCategoryId: number | null }[]> => {
    const response = await apiClient.get('/restaurants/stats/weekly-top');
    return response.data;
  },

  // 통계: 인기 장소 TOP5
  getPopular: async (): Promise<{ id: number; name: string; category: string | null; thumbnailImage: string | null; totalVisitCount: number; placeCategoryId: number | null }[]> => {
    const response = await apiClient.get('/restaurants/stats/popular');
    return response.data;
  },

  // 통계: 카테고리별 장소 수
  getCategorySummary: async (): Promise<{ placeCategoryId: number; name: string; restaurantCount: number }[]> => {
    const response = await apiClient.get('/restaurants/stats/category-summary');
    return response.data;
  },

  // 그룹 필터: 그룹 구성원이 방문/제보한 맛집
  getGroupRestaurants: async (groupId: number, bounds: MapBounds, priceRange?: PriceRange): Promise<PageResponse<Restaurant>> => {
    const response = await apiClient.get<PageResponse<Restaurant>>(`/groups/${groupId}/restaurants`, {
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
