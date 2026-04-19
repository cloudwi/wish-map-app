import apiClient from './client';
import { Comment, PageResponse } from '../types';

export const commentApi = {
  // 댓글 목록 - cursor(createdAt, id) 기반 keyset pagination.
  // cursor 미지정 시 최신 댓글부터 반환, cursor 지정 시 해당 커서보다 오래된 댓글부터 반환.
  getComments: async (
    placeId: number,
    size = 20,
    cursor?: { cursorCreatedAt: string; cursorId: number }
  ): Promise<PageResponse<Comment>> => {
    const response = await apiClient.get<PageResponse<Comment>>(
      `/places/${placeId}/comments`,
      { params: { size, ...(cursor ?? {}) } }
    );
    return response.data;
  },

  // 댓글 작성
  createComment: async (placeId: number, content: string, imageUrls?: string[], tags?: string[]): Promise<Comment> => {
    const response = await apiClient.post<Comment>(
      `/places/${placeId}/comments`,
      { content, imageUrls, tags }
    );
    return response.data;
  },

  // 댓글 수정
  updateComment: async (commentId: number, content: string, tags?: string[]): Promise<Comment> => {
    const response = await apiClient.patch<Comment>(
      `/comments/${commentId}`,
      { content, tags }
    );
    return response.data;
  },

  // 댓글 삭제
  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
