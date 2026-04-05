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
  tagGroups: TagGroup[];
}

export const DEFAULT_PLACE_CATEGORIES: PlaceCategory[] = [
  {
    id: 1, name: '음식점', icon: null, hasPriceRange: true,
    tagGroups: [
      { key: '가격대', tags: ['1만원 이하', '1만원대', '2만원대', '3만원대', '3만원 이상'] },
      { key: '분위기', tags: ['혼밥 성지', '회식 추천', '데이트', '조용한', '활기찬'] },
      { key: '맛 특징', tags: ['매운맛', '달콤한', '담백한', '짜릿한', '고소한'] },
      { key: '편의', tags: ['주차 편해', '대기 없음', '늦게까지', '반려동물 OK'] },
      { key: '한줄평', tags: ['또 갈 집', '숨은 맛집', '점심 맛집', '가성비 갑'] },
    ],
  },
  {
    id: 2, name: '카페,디저트', icon: null, hasPriceRange: false,
    tagGroups: [
      { key: '분위기', tags: ['조용한', '넓은', '루프탑', '감성적인', '작업하기 좋은'] },
      { key: '메뉴', tags: ['커피 맛집', '디저트 맛집', '브런치', '음료 다양'] },
      { key: '한줄평', tags: ['또 갈 곳', '숨은 카페', '뷰 맛집'] },
    ],
  },
  {
    id: 3, name: '쇼핑,유통', icon: null, hasPriceRange: false,
    tagGroups: [
      { key: '특징', tags: ['가성비', '품질 좋은', '종류 다양', '친절한'] },
    ],
  },
  {
    id: 4, name: '생활,편의', icon: null, hasPriceRange: false,
    tagGroups: [
      { key: '종류', tags: ['철물점', '세탁소', '수선집', '열쇠'] },
      { key: '특징', tags: ['친절한', '가성비', '실력 좋은', '빠른'] },
    ],
  },
  {
    id: 5, name: '여행,숙박', icon: null, hasPriceRange: false,
    tagGroups: [
      { key: '특징', tags: ['뷰 맛집', '깨끗한', '가성비', '위치 좋은'] },
    ],
  },
  {
    id: 6, name: '문화,예술', icon: null, hasPriceRange: false,
    tagGroups: [
      { key: '특징', tags: ['볼거리 많은', '조용한', '가족 추천', '데이트'] },
    ],
  },
  {
    id: 7, name: '교육,학문', icon: null, hasPriceRange: false,
    tagGroups: [
      { key: '특징', tags: ['전문적인', '친절한', '가성비'] },
    ],
  },
  {
    id: 8, name: '의료,건강', icon: null, hasPriceRange: false,
    tagGroups: [
      { key: '특징', tags: ['친절한', '실력 좋은', '대기 없음', '깨끗한'] },
    ],
  },
];

// 네이버 카테고리 문자열 → PlaceCategory 매칭 (대분류 기반)
export function matchNaverCategory(naverCategory: string, categories: PlaceCategory[]): PlaceCategory | null {
  if (!naverCategory) return null;

  // "카페,디저트>카페" → "카페,디저트"로 대분류 추출
  const majorPart = naverCategory.split('>')[0].trim();
  return categories.find(c => c.name === majorPart) || null;
}

// Restaurant
export interface Restaurant {
  id: number;
  name: string;
  lat: number;
  lng: number;
  naverPlaceId: string | null;
  category: string | null;
  thumbnailImage: string | null;
  likeCount: number;
  visitCount: number;
  weeklyChampion: string | null;
  priceRange: PriceRange | null;
  placeCategoryId: number | null;
}

export interface RestaurantDetail extends Restaurant {
  naverPlaceId: string | null;
  description: string | null;
  images: string[];
  suggestedBy: UserSummary;
  commentCount: number;
  isLiked: boolean;
  isVisited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSummary {
  id: number;
  nickname: string;
  profileImage: string | null;
}

export interface CreateRestaurantRequest {
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

// Collection (Like Group)
export interface LikeGroup {
  id: number;
  name: string;
  restaurantCount: number;
  hasRestaurant: boolean;
}

// API Response
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Map bounds
export interface MapBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}
