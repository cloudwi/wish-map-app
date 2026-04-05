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
});

// 강제 업데이트 필요 여부
let forceUpdateRequired = false;
export const isForceUpdateRequired = () => forceUpdateRequired;

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

    // 426: 강제 업데이트 필요
    if (error.response?.status === 426) {
      forceUpdateRequired = true;
      return Promise.reject(error);
    }

    // 403: 유저가 DB에 없는 경우 (DB 초기화 등) → 강제 로그아웃
    if (error.response?.status === 403) {
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
