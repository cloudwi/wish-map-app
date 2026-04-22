import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Alert, Image } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { blockApi, BlockedUserResponse } from '../api/block';
import { showSuccess, showError } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';
import { lightTap } from '../utils/haptics';
import { EmptyState } from '../components/EmptyState';
import { LoadingOverlay } from '../components/LoadingOverlay';

export default function BlockedUsersScreen() {
  const c = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBlockedUsers = async () => {
    try {
      const data = await blockApi.getBlockedUsers();
      setBlockedUsers(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBlockedUsers(); }, []);

  const handleUnblock = (user: BlockedUserResponse) => {
    Alert.alert('차단 해제', `${user.nickname}님의 차단을 해제하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        onPress: async () => {
          lightTap();
          try {
            await blockApi.unblock(user.userId);
            setBlockedUsers(prev => prev.filter(u => u.userId !== user.userId));
            showSuccess('차단 해제', `${user.nickname}님의 차단이 해제되었습니다`);
          } catch (e: unknown) {
            showError('오류', getErrorMessage(e));
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: BlockedUserResponse }) => (
    <View style={[styles.row, { borderBottomColor: c.divider }]}>
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={[styles.avatar, { backgroundColor: c.primaryBg }]} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: c.primaryBg, justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="person" size={20} color={c.primary} />
        </View>
      )}
      <Text style={[styles.nickname, { color: c.textPrimary }]}>{item.nickname}</Text>
      <TouchableOpacity
        style={[styles.unblockButton, { borderColor: c.border }]}
        onPress={() => handleUnblock(item)}
        activeOpacity={0.7}
      >
        <Text style={[styles.unblockText, { color: c.textSecondary }]}>해제</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: '차단 목록', headerBackTitle: '뒤로' }} />
      {loading ? (
        <LoadingOverlay />
      ) : blockedUsers.length === 0 ? (
        <EmptyState icon="shield-checkmark-outline" title="차단한 사용자가 없습니다" />
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  nickname: { flex: 1, fontSize: 15, fontWeight: '500' },
  unblockButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  unblockText: { fontSize: 13, fontWeight: '600' },
});
