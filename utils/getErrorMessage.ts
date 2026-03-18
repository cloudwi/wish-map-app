import axios from 'axios';

export function getErrorMessage(error: unknown, fallback = '오류가 발생했습니다.'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
