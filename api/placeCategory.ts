import { apiClient } from './client';
import { PlaceCategory } from '../types';

let cache: PlaceCategory[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 30; // 30분

export const placeCategoryApi = {
  getPlaceCategories: async (): Promise<PlaceCategory[]> => {
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      return cache;
    }
    const { data } = await apiClient.get<PlaceCategory[]>('/place-categories');
    cache = data;
    cacheTime = Date.now();
    return data;
  },
};
