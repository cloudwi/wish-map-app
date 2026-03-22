import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { friendApi, FriendResponse } from '../../api/friend';
import { groupApi, GroupInviteResponse } from '../../api/group';
import { notificationApi, NotificationResponse } from '../../api/notification';
import { useGroupStore } from '../../stores/groupStore';
import { lightTap, successTap } from '../../utils/haptics';
import { showSuccess, showError } from '../../utils/toast';
import { getErrorMessage } from '../../utils/getErrorMessage';

type NotifItem =
  | { type: 'friend'; data: FriendResponse }
  | { type: 'group'; data: GroupInviteResponse }
  | { type: 'info'; data: NotificationResponse };

export default function NotificationsScreen() {
  const c = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { fetchGroups } = useGroupStore();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [friendReqs, groupInvites, notifs] = await Promise.all([
        friendApi.getPendingRequests(),
        groupApi.getInvites(),
        notificationApi.getNotifications(0, 50).catch(() => ({ content: [] })),
      ]);
      // 일반 알림에서 이미 액션 알림으로 보여주는 것 제외
      const infoNotifs = notifs.content.filter(
        (n) => n.type !== 'FRIEND_REQUEST' && n.type !== 'GROUP_INVITE'
      );
      const merged: NotifItem[] = [
        ...friendReqs.map((f) => ({ type: 'friend' as const, data: f })),
        ...groupInvites.map((g) => ({ type: 'group' as const, data: g })),
        ...infoNotifs.map((n) => ({ type: 'info' as const, data: n })),
      ];
      setItems(merged);
      // 모두 읽음 처리
      notificationApi.markAllAsRead().catch(() => {});
    } catch {} finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const handleAcceptFriend = async (item: FriendResponse) => {
    setProcessingId(`friend-${item.id}`);
    try {
      await friendApi.acceptRequest(item.id);
      successTap();
      setItems(prev => prev.filter(i => !(i.type === 'friend' && i.data.id === item.id)));
      showSuccess('수락 완료', `${item.user.nickname}님과 친구가 되었습니다!`);
    } catch (e: unknown) { showError('오류', getErrorMessage(e)); }
    finally { setProcessingId(null); }
  };

  const handleRejectFriend = async (item: FriendResponse) => {
    setProcessingId(`friend-${item.id}`);
    try {
      await friendApi.rejectRequest(item.id);
      setItems(prev => prev.filter(i => !(i.type === 'friend' && i.data.id === item.id)));
    } catch (e: unknown) { showError('오류', getErrorMessage(e)); }
    finally { setProcessingId(null); }
  };

  const handleAcceptGroup = async (item: GroupInviteResponse) => {
    setProcessingId(`group-${item.groupId}`);
    try {
      await groupApi.acceptInvite(item.groupId);
      successTap();
      setItems(prev => prev.filter(i => !(i.type === 'group' && i.data.groupId === item.groupId)));
      fetchGroups();
      showSuccess('수락 완료', `'${item.groupName}' 그룹에 참여했습니다!`);
    } catch (e: unknown) { showError('오류', getErrorMessage(e)); }
    finally { setProcessingId(null); }
  };

  const handleRejectGroup = async (item: GroupInviteResponse) => {
    setProcessingId(`group-${item.groupId}`);
    try {
      await groupApi.rejectInvite(item.groupId);
      setItems(prev => prev.filter(i => !(i.type === 'group' && i.data.groupId === item.groupId)));
    } catch (e: unknown) { showError('오류', getErrorMessage(e)); }
    finally { setProcessingId(null); }
  };

  const renderItem = ({ item }: { item: NotifItem }) => {
    if (item.type === 'friend') {
      const f = item.data;
      const isProcessing = processingId === `friend-${f.id}`;
      return (
        <View style={[styles.card, { backgroundColor: c.cardBg }]}>
          <View style={[styles.iconWrap, { backgroundColor: '#4CAF50' + '20' }]}>
            <Ionicons name="person-add" size={18} color="#4CAF50" />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]}>친구 요청</Text>
            <Text style={[styles.cardDesc, { color: c.textSecondary }]}>
              <Text style={{ fontWeight: '600' }}>{f.user.nickname}</Text>님이 친구 요청을 보냈어요
            </Text>
          </View>
          {isProcessing ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.rejectBtn, { borderColor: c.border }]}
                onPress={() => { lightTap(); handleRejectFriend(f); }}
              >
                <Text style={[styles.rejectText, { color: c.textSecondary }]}>거절</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: c.primary }]}
                onPress={() => handleAcceptFriend(f)}
              >
                <Text style={styles.acceptText}>수락</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    if (item.type === 'group') {
      const g = item.data as GroupInviteResponse;
      const isProcessing = processingId === `group-${g.groupId}`;
      return (
        <View style={[styles.card, { backgroundColor: c.cardBg }]}>
          <View style={[styles.iconWrap, { backgroundColor: c.primary + '20' }]}>
            <Ionicons name="people" size={18} color={c.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, { color: c.textPrimary }]}>그룹 초대</Text>
            <Text style={[styles.cardDesc, { color: c.textSecondary }]}>
              <Text style={{ fontWeight: '600' }}>{g.invitedBy}</Text>님이 '<Text style={{ fontWeight: '600' }}>{g.groupName}</Text>' 그룹에 초대했어요
            </Text>
          </View>
          {isProcessing ? (
            <ActivityIndicator size="small" color={c.primary} />
          ) : (
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.rejectBtn, { borderColor: c.border }]}
                onPress={() => { lightTap(); handleRejectGroup(g); }}
              >
                <Text style={[styles.rejectText, { color: c.textSecondary }]}>거절</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.acceptBtn, { backgroundColor: c.primary }]}
                onPress={() => handleAcceptGroup(g)}
              >
                <Text style={styles.acceptText}>수락</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    // info 타입 (위치 변경 등 일반 알림)
    const n = item.data as NotificationResponse;
    const iconMap: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
      GROUP_LOCATION_CHANGED: { name: 'location', color: '#2196F3' },
    };
    const icon = iconMap[n.type] || { name: 'notifications', color: c.textTertiary };
    return (
      <View style={[styles.card, { backgroundColor: c.cardBg }, !n.isRead && { backgroundColor: c.primary + '08' }]}>
        <View style={[styles.iconWrap, { backgroundColor: icon.color + '20' }]}>
          <Ionicons name={icon.name} size={18} color={icon.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: c.textPrimary }]}>{n.title}</Text>
          <Text style={[styles.cardDesc, { color: c.textSecondary }]}>{n.message}</Text>
          <Text style={{ fontSize: 11, color: c.textDisabled, marginTop: 4 }}>
            {new Date(n.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{
        title: '알림',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={24} color={c.textPrimary} />
          </TouchableOpacity>
        ),
      }} />
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={c.primary} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.type === 'friend' ? `f-${item.data.id}` : `g-${item.data.groupId}`}
          renderItem={renderItem}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={40} color={c.textDisabled} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>알림이 없어요</Text>
              <Text style={[styles.emptyDesc, { color: c.textTertiary }]}>
                {'친구 요청이나 그룹 초대가 오면\n여기에서 알려드릴게요'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  emptyContainer: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 6 },
  rejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  rejectText: { fontSize: 12, fontWeight: '600' },
  acceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  acceptText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
