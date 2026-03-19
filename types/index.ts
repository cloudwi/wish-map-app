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
  user: UserSummary;
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
