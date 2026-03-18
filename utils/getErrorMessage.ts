import axios from 'axios';

export function getErrorMessage(error: unknown, fallback = '오류가 발생했습니다.'): string {
  if (axios.isAxiosError(error)) {
    const msg = error.response?.data?.message;
    if (msg) return msg;
    if (!error.response) return '서버에 연결할 수 없습니다. 네트워크를 확인해주세요.';
    return fallback;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
