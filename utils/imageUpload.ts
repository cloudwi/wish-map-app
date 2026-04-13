import * as ImageManipulator from 'expo-image-manipulator';
import apiClient from '../api/client';

const MAX_WIDTH = 1200;
const COMPRESS_QUALITY = 0.7;

/** 이미지를 리사이즈 + 압축 후 URI 반환 */
async function compressImage(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: COMPRESS_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

const MAX_RETRIES = 2;

/** 여러 이미지를 압축 후 백엔드 경유로 업로드, URL 배열 반환 (실패 시 재시도) */
export async function uploadImages(uris: string[]): Promise<string[]> {
  const compressed = await Promise.all(uris.map(compressImage));

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const formData = new FormData();
      for (const uri of compressed) {
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
        formData.append('files', {
          uri,
          type: 'image/jpeg',
          name: fileName,
        } as unknown as Blob);
      }

      const response = await apiClient.post<{ urls: string[] }>('/images/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      return response.data.urls;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}
