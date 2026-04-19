import { apiClient } from './client';

export interface NotificationResponse {
  id: number;
  type: 'GROUP_LOCATION_CHANGED' | 'GROUP_INVITE' | 'FRIEND_REQUEST';
  title: string;
  message: string;
  isRead: boolean;
  referenceId: number | null;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (page = 0, size = 20) => {
    const { data } = await apiClient.get('/notifications', { params: { page, size } });
    return data as { content: NotificationResponse[]; last: boolean };
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/unread-count');
    return data.count;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};
