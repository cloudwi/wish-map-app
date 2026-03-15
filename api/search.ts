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

  return (data.items || []).map((item: any, index: number) => ({
    id: `${index}-${item.mapx}-${item.mapy}`,
    name: stripHtml(item.title),
    address: item.address || '',
    roadAddress: item.roadAddress || '',
    lat: Number(item.mapy) / 10000000,
    lng: Number(item.mapx) / 10000000,
    category: item.category || '',
    phone: item.telephone || '',
  }));
}
