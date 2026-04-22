import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

// 5xx / 네트워크 에러 / 타임아웃만 down 으로 간주. 404 등 4xx 는 서버가 살아있는 것으로 판단.
export const checkServerHealth = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/health`, { timeout: 4000 });
    return res.status < 500;
  } catch (e: any) {
    if (e.response) return e.response.status < 500;
    return false;
  }
};
