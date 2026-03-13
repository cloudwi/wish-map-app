import apiClient from './client';
import { 
  Restaurant, 
  RestaurantDetail, 
  CreateRestaurantRequest, 
  PageResponse,
  MapBounds 
} from '../types';

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

  // 좋아요 토글
  toggleLike: async (id: number): Promise<{ liked: boolean }> => {
    const response = await apiClient.post<{ liked: boolean }>(`/restaurants/${id}/like`);
    return response.data;
  },

  // 북마크 토글
  toggleBookmark: async (id: number): Promise<{ bookmarked: boolean }> => {
    const response = await apiClient.post<{ bookmarked: boolean }>(`/restaurants/${id}/bookmark`);
    return response.data;
  },

  // 북마크 목록
  getBookmarks: async (page = 0, size = 20): Promise<PageResponse<Restaurant>> => {
    const response = await apiClient.get<PageResponse<Restaurant>>('/restaurants/bookmarks', {
      params: { page, size },
    });
    return response.data;
  },
};
