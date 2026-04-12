import { apiClient } from './client';

export interface TrendTagResponse {
  id: number;
  label: string;
  placeCategoryId: number | null;
  tags: string[] | null;
  priceRange: string | null;
}

let cache: TrendTagResponse[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 30; // 30분

export const trendTagApi = {
  getTrendTags: async (): Promise<TrendTagResponse[]> => {
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      return cache;
    }
    const { data } = await apiClient.get<TrendTagResponse[]>('/trend-tags');
    cache = data;
    cacheTime = Date.now();
    return data;
  },
};
