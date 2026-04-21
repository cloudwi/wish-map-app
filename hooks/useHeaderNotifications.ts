import { useQueries, useQueryClient } from '@tanstack/react-query';
import { friendApi, type FriendResponse } from '../api/friend';
import { groupApi, type GroupInviteResponse } from '../api/group';
import { notificationApi } from '../api/notification';
import { useAuthStore } from '../stores/authStore';

export const headerNotificationKeys = {
  friendRequests: ['friends', 'pending'] as const,
  groupInvites: ['groups', 'invites'] as const,
  unreadCount: ['notifications', 'unread'] as const,
};

export function useHeaderNotifications() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const results = useQueries({
    queries: [
      {
        queryKey: headerNotificationKeys.friendRequests,
        queryFn: () => friendApi.getPendingRequests(),
        enabled: isAuthenticated,
        staleTime: 60_000,
      },
      {
        queryKey: headerNotificationKeys.groupInvites,
        queryFn: () => groupApi.getInvites(),
        enabled: isAuthenticated,
        staleTime: 60_000,
      },
      {
        queryKey: headerNotificationKeys.unreadCount,
        queryFn: () => notificationApi.getUnreadCount().catch(() => 0),
        enabled: isAuthenticated,
        staleTime: 30_000,
      },
    ],
  });

  const [friendQ, groupQ, unreadQ] = results;
  const friendRequests: FriendResponse[] = friendQ.data ?? [];
  const groupInvites: GroupInviteResponse[] = groupQ.data ?? [];
  const unreadCount: number = unreadQ.data ?? 0;

  return {
    friendRequests,
    groupInvites,
    unreadCount,
    notifCount: friendRequests.length + groupInvites.length + unreadCount,
    isLoading: results.some((r) => r.isLoading),
  };
}

export function useInvalidateHeaderNotifications() {
  const queryClient = useQueryClient();
  return {
    invalidateFriendRequests: () =>
      queryClient.invalidateQueries({ queryKey: headerNotificationKeys.friendRequests }),
    invalidateGroupInvites: () =>
      queryClient.invalidateQueries({ queryKey: headerNotificationKeys.groupInvites }),
    invalidateUnreadCount: () =>
      queryClient.invalidateQueries({ queryKey: headerNotificationKeys.unreadCount }),
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: headerNotificationKeys.friendRequests });
      queryClient.invalidateQueries({ queryKey: headerNotificationKeys.groupInvites });
      queryClient.invalidateQueries({ queryKey: headerNotificationKeys.unreadCount });
    },
  };
}
