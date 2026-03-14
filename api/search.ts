import axios from 'axios';

const NAVER_CLIENT_ID = process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_ID || '';
const NAVER_CLIENT_SECRET = process.env.EXPO_PUBLIC_NAVER_SEARCH_CLIENT_SECRET || '';

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

// 카텍 좌표 → WGS84 변환 (근사치)
function katecToWgs84(x: number, y: number): { lat: number; lng: number } {
  // 네이버 지역검색 API는 카텍 좌표를 반환
  // 간단한 변환 공식 (서울 근처 기준, 오차 ~수십m)
  const lng = x / 10000000;
  const lat = y / 10000000;

  // 좌표가 이미 WGS84 범위인지 확인
  if (lat > 30 && lat < 43 && lng > 124 && lng < 132) {
    return { lat, lng };
  }

  // 카텍 좌표인 경우 (큰 숫자)
  return {
    lat: y / 10000000,
    lng: x / 10000000,
  };
}

// 네이버 지역 검색
export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  if (!query.trim()) return [];

  const { data } = await axios.get('https://openapi.naver.com/v1/search/local.json', {
    params: { query, display: 15, sort: 'comment' },
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
  });

  return data.items.map((item: any, index: number) => {
    const coords = katecToWgs84(Number(item.mapx), Number(item.mapy));
    return {
      id: `${index}-${item.mapx}-${item.mapy}`,
      name: stripHtml(item.title),
      address: item.address || '',
      roadAddress: item.roadAddress || '',
      lat: coords.lat,
      lng: coords.lng,
      category: item.category || '',
      phone: item.telephone || '',
    };
  });
}
