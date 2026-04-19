// User
export interface User {
  id: number;
  email: string;
  nickname: string;
  profileImage: string | null;
  role: 'USER' | 'ADMIN';
}

// Auth
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export type AuthProvider = 'KAKAO' | 'GOOGLE' | 'NAVER' | 'APPLE';

// Price Range
export type PriceRange = 'UNDER_10K' | 'RANGE_10K' | 'RANGE_20K' | 'RANGE_30K' | 'OVER_30K';

export const PRICE_RANGE_LABELS: Record<PriceRange, string> = {
  UNDER_10K: '1만원 이하',
  RANGE_10K: '1만원대',
  RANGE_20K: '2만원대',
  RANGE_30K: '3만원대',
  OVER_30K: '3만원 이상',
};

export const PRICE_RANGES: PriceRange[] = ['UNDER_10K', 'RANGE_10K', 'RANGE_20K', 'RANGE_30K', 'OVER_30K'];

// Tag Categories (legacy - 하위호환용)
export interface TagCategory {
  key: string;
  label: string;
  tags: string[];
}

export const TAG_CATEGORIES: TagCategory[] = [
  {
    key: 'atmosphere',
    label: '분위기',
    tags: ['혼밥 성지', '회식 추천', '데이트', '조용한', '활기찬'],
  },
  {
    key: 'taste',
    label: '맛 특징',
    tags: ['매운맛', '달콤한', '담백한', '짜릿한', '고소한'],
  },
  {
    key: 'convenience',
    label: '편의',
    tags: ['주차 편해', '대기 없음', '늦게까지', '반려동물 OK'],
  },
  {
    key: 'oneLiner',
    label: '한줄평',
    tags: ['또 갈 집', '숨은 맛집', '점심 맛집', '줄 서는 집', '가성비 갑', '뷰 맛집'],
  },
];

export const ALL_KNOWN_TAGS: string[] = TAG_CATEGORIES.flatMap(c => c.tags);

// Place Categories (API 기반)
export interface TagGroup {
  key: string;
  tags: string[];
}

export interface PlaceCategory {
  id: number;
  name: string;
  icon: string | null;
  hasPriceRange: boolean;
  customOnly: boolean;
  tagGroups: TagGroup[];
}


// Place
export interface Place {
  id: number;
  name: string;
  lat: number;
  lng: number;
  naverPlaceId: string | null;
  category: string | null;
  thumbnailImage: string | null;
  visitCount: number;
  weeklyChampion: string | null;
  priceRange: PriceRange | null;
  placeCategoryId: number | null;
  lastVisitedAt: string | null;
}

export interface PlaceDetail extends Place {
  naverPlaceId: string | null;
  description: string | null;
  images: string[];
  suggestedBy: UserSummary;
  commentCount: number;
  isVisited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: number;
  nickname: string;
  profileImage: string | null;
}

export interface CreatePlaceRequest {
  name: string;
  lat: number;
  lng: number;
  naverPlaceId?: string;
  category?: string;
  description?: string;
  thumbnailImage?: string;
  imageUrls?: string[];
}

// Comment
export interface Comment {
  id: number;
  content: string;
  tags: string[];
  images: string[];
  user: UserSummary;
  userVisitCount: number;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  isDeleted: boolean;
  isMine: boolean;
}

// API Response
// 백엔드가 Spring Data Slice로 응답 - totalElements/totalPages 없음 (COUNT 쿼리 생략으로 무한스크롤 성능 개선).
// 다음 페이지 존재 여부는 last 필드로 판단.
export interface PageResponse<T> {
  content: T[];
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

// Map bounds
export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
