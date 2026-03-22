import apiClient from '../api/client';

/** 여러 이미지를 백엔드 경유로 업로드 후 URL 배열 반환 */
export async function uploadImages(uris: string[]): Promise<string[]> {
  const formData = new FormData();

  for (const uri of uris) {
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

    // React Native FormData는 { uri, type, name } 객체를 지원
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
}
