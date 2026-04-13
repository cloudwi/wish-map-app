import { apiClient } from './client';
import { PlaceCategory } from '../types';

let cache: PlaceCategory[] | null = null;
let cacheTime = 0;
let inflight: Promise<PlaceCategory[]> | null = null;
const CACHE_TTL = 1000 * 60 * 30; // 30분

export const placeCategoryApi = {
  getPlaceCategories: async (): Promise<PlaceCategory[]> => {
    if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;
    if (inflight) return inflight;

    inflight = (async () => {
      try {
        const { data } = await apiClient.get<PlaceCategory[]>('/place-categories');
        cache = data;
        cacheTime = Date.now();
        return data;
      } finally {
        inflight = null;
      }
    })();
    return inflight;
  },
};
