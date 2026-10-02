import { apiClient } from './client';

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  roadAddress: string;
  lat: number;
  lng: number;
  category: string;
}

interface NaverPlaceItem {
  title: string;
  category?: string;
  address?: string;
  roadAddress?: string;
  mapx: string;
  mapy: string;
}

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query.trim()) return [];
  const { data } = await apiClient.get<{ items: NaverPlaceItem[] }>('/search/places', {
    params: { query: query.trim(), display: 15 },
  });
  return (data.items || []).map((item) => ({
    id: `${item.mapx}-${item.mapy}`,
    name: item.title.replace(/<[^>]*>/g, ''),
    address: item.address || '',
    roadAddress: item.roadAddress || '',
    lat: Number(item.mapy) / 10000000,
    lng: Number(item.mapx) / 10000000,
    category: item.category || '',
  }));
}
