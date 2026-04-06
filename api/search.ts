import { apiClient } from './client';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  category: string;
  phone: string;
  link: string;
}

export interface NaverPlaceItem {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
}

// 이미지 검색 캐시 (세션 동안 유지)
const imageCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

// 이미지 검색 (1장) — 캐시 + 중복 요청 방지
export async function searchPlaceImage(query: string): Promise<string | null> {
  if (imageCache.has(query)) return imageCache.get(query)!;
  if (pendingRequests.has(query)) return pendingRequests.get(query)!;

  const request = (async () => {
    try {
      const { data } = await apiClient.get('/search/images', {
        params: { query, display: 1 },
      });
      const item = data.items?.[0];
      if (!item) { imageCache.set(query, null); return null; }
      // thumbnail: 네이버 HTTPS 프록시 (항상 안전), b150→b400으로 고화질
      const url = (item.thumbnail || item.link || '')
        .replace('type=b150', 'type=b400') || null;
      imageCache.set(query, url);
      return url;
    } catch {
      imageCache.set(query, null);
      return null;
    } finally {
      pendingRequests.delete(query);
    }
  })();

  pendingRequests.set(query, request);
  return request;
}

// 이미지 검색 (여러 장)
export async function searchPlaceImages(query: string, count = 5): Promise<string[]> {
  try {
    const { data } = await apiClient.get('/search/images', {
      params: { query, display: count },
    });
    return (data.items || []).map((item: any) => item.link || item.thumbnail).filter(Boolean);
  } catch {
    return [];
  }
}

// HTML 태그 제거
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

// 네이버 지역 검색 (백엔드 프록시)
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query.trim()) return [];

  const { data } = await apiClient.get('/search/places', {
    params: { query, display: 15 },
  });

  return (data.items || []).map((item: NaverPlaceItem, index: number) => ({
    id: `${item.mapx}-${item.mapy}`,
    name: stripHtml(item.title),
    address: item.address || '',
    roadAddress: item.roadAddress || '',
    lat: Number(item.mapy) / 10000000,
    lng: Number(item.mapx) / 10000000,
    category: item.category || '',
    phone: item.telephone || '',
    link: item.link || '',
  }));
}
