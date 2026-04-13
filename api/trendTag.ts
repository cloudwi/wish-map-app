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
let inflight: Promise<TrendTagResponse[]> | null = null;
const CACHE_TTL = 1000 * 60 * 30; // 30분

export const trendTagApi = {
  getTrendTags: async (): Promise<TrendTagResponse[]> => {
    if (cache && Date.now() - cacheTime < CACHE_TTL) return cache;
    if (inflight) return inflight;

    inflight = (async () => {
      try {
        const { data } = await apiClient.get<TrendTagResponse[]>('/trend-tags');
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
