import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import { getItem, setItem, deleteItem } from '../utils/secureStorage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: {
    indexes: null, // tags=a&tags=b (Spring 호환)
  },
});

// 강제 업데이트 필요 여부
let forceUpdateRequired = false;
let forceUpdateStoreUrl = '';
export const isForceUpdateRequired = () => forceUpdateRequired;
export const getForceUpdateStoreUrl = () => forceUpdateStoreUrl;

// Request interceptor - add auth token + app version
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.headers['X-App-Version'] = APP_VERSION;
    config.headers['X-App-Platform'] = require('react-native').Platform.OS;
    const token = await getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Token refresh state - prevents concurrent refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const status = error.response?.status;
    const url = originalRequest?.url || '';

    // API 에러 로깅 (4xx/5xx)
    if (status && status >= 400 && status !== 401) {
      console.warn(`[API] ${originalRequest?.method?.toUpperCase()} ${url} → ${status}`);
    }
    if (status && status >= 500) {
      console.error(`[API] 서버 에러: ${url}`, error.response?.data);
    }

    // 426: 강제 업데이트 필요
    if (status === 426) {
      forceUpdateRequired = true;
      forceUpdateStoreUrl = (error.response?.data as any)?.storeUrl || '';
      return Promise.reject(error);
    }

    // 403: 유저가 DB에 없는 경우 (DB 초기화 등) → 강제 로그아웃
    if (status === 403) {
      console.warn('[AUTH] 403 강제 로그아웃');
      const token = await getItem('accessToken');
      if (token) {
        await deleteItem('accessToken');
        await deleteItem('refreshToken');
        const { useAuthStore } = require('../stores/authStore');
        useAuthStore.getState().forceLogout();
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Another request is already refreshing - wait for it
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await setItem('accessToken', accessToken);
        await setItem('refreshToken', newRefreshToken);

        isRefreshing = false;
        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.warn('[AUTH] 토큰 갱신 실패, 로그아웃 처리');
        isRefreshing = false;
        refreshSubscribers = [];
        await deleteItem('accessToken');
        await deleteItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
