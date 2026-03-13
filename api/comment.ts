import apiClient from './client';
import { Comment, PageResponse } from '../types';

export const commentApi = {
  // 댓글 목록
  getComments: async (restaurantId: number, page = 0, size = 20): Promise<PageResponse<Comment>> => {
    const response = await apiClient.get<PageResponse<Comment>>(
      `/restaurants/${restaurantId}/comments`,
      { params: { page, size } }
    );
    return response.data;
  },

  // 댓글 작성
  createComment: async (restaurantId: number, content: string): Promise<Comment> => {
    const response = await apiClient.post<Comment>(
      `/restaurants/${restaurantId}/comments`,
      { content }
    );
    return response.data;
  },

  // 댓글 수정
  updateComment: async (commentId: number, content: string): Promise<Comment> => {
    const response = await apiClient.patch<Comment>(
      `/comments/${commentId}`,
      { content }
    );
    return response.data;
  },

  // 댓글 삭제
  deleteComment: async (commentId: number): Promise<void> => {
    await apiClient.delete(`/comments/${commentId}`);
  },
};
