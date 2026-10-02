export interface User {
  id: number;
  nickname: string;
  profileImage: string | null;
  role: 'USER' | 'ADMIN';
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}
