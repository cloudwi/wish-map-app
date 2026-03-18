import { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { AuthRequired } from '../components/AuthRequired';
import { useAuthStore } from '../stores/authStore';
import { friendApi, FriendResponse, FriendStatus, UserSearchResult } from '../api/friend';
import { lightTap } from '../utils/haptics';
import { showError } from '../utils/toast';

type Tab = 'friends' | 'requests';

export default function FriendsScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  const [tab, setTab] = useState<Tab>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [requests, setRequests] = useState<FriendResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const isSearching = searchQuery.length >= 2;

  const loadData = useCallback(async () => {
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendApi.getFriends(),
        friendApi.getPendingRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch {
      showError('오류', '친구 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated, loadData]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await friendApi.searchUsers(query);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSendRequest = async (userId: number) => {
    lightTap();
    try {
      await friendApi.sendRequest(userId);
      setSearchResults(prev =>
        prev.map(u => u.id === userId ? { ...u, friendStatus: 'PENDING' as FriendStatus } : u)
      );
    } catch {
      showError('오류', '친구 요청을 보낼 수 없습니다.');
    }
  };

  const handleAccept = async (friendId: number) => {
    lightTap();
    try {
      const updated = await friendApi.acceptRequest(friendId);
      setRequests(prev => prev.filter(r => r.id !== friendId));
      setFriends(prev => [...prev, updated]);
    } catch {
      showError('오류', '요청을 수락할 수 없습니다.');
    }
  };

  const handleReject = async (friendId: number) => {
    lightTap();
    try {
      await friendApi.rejectRequest(friendId);
      setRequests(prev => prev.filter(r => r.id !== friendId));
    } catch {
      showError('오류', '요청을 거절할 수 없습니다.');
    }
  };

  const handleRemove = (friendId: number, nickname: string) => {
    Alert.alert(
      '친구 삭제',
      `${nickname}님을 친구 목록에서 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            try {
              await friendApi.removeFriend(friendId);
              setFriends(prev => prev.filter(f => f.id !== friendId));
            } catch {
              showError('오류', '친구를 삭제할 수 없습니다.');
            }
          },
        },
      ]
    );
  };

  if (!isAuthenticated) {
    return <AuthRequired message="로그인하고 친구를 추가해보세요!" />;
  }

  const renderSearchResult = ({ item }: { item: UserSearchResult }) => (
    <View style={[styles.userRow, { borderBottomColor: c.divider }]}>
      <View style={[styles.avatar, { backgroundColor: c.primaryBg }]}>
        {item.profileImage
          ? <Image source={{ uri: item.profileImage }} style={styles.avatarImg} />
          : <Ionicons name="person" size={20} color={c.primary} />}
      </View>
      <Text style={[styles.nickname, { color: c.textPrimary }]}>{item.nickname}</Text>
      {item.friendStatus === 'ACCEPTED' ? (
        <View style={[styles.statusBadge, { backgroundColor: c.successBg }]}>
          <Text style={[styles.statusText, { color: c.success }]}>친구</Text>
        </View>
      ) : item.friendStatus === 'PENDING' ? (
        <View style={[styles.statusBadge, { backgroundColor: c.categoryBadgeBg }]}>
          <Text style={[styles.statusText, { color: c.textSecondary }]}>요청 중</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: c.primary }]}
          onPress={() => handleSendRequest(item.id)}
          activeOpacity={0.8}
        >
          <Ionicons name="person-add-outline" size={14} color="#fff" />
          <Text style={styles.addBtnText}>추가</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRequest = ({ item }: { item: FriendResponse }) => (
    <View style={[styles.userRow, { borderBottomColor: c.divider }]}>
      <View style={[styles.avatar, { backgroundColor: c.primaryBg }]}>
        {item.user.profileImage
          ? <Image source={{ uri: item.user.profileImage }} style={styles.avatarImg} />
          : <Ionicons name="person" size={20} color={c.primary} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.nickname, { color: c.textPrimary }]}>{item.user.nickname}</Text>
        <Text style={[styles.requestHint, { color: c.textTertiary }]}>친구 요청을 보냈어요</Text>
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.rejectBtn, { borderColor: c.border }]}
          onPress={() => handleReject(item.id)}
          activeOpacity={0.8}
        >
          <Text style={[styles.rejectBtnText, { color: c.textSecondary }]}>거절</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptBtn, { backgroundColor: c.primary }]}
          onPress={() => handleAccept(item.id)}
          activeOpacity={0.8}
        >
          <Text style={styles.acceptBtnText}>수락</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }: { item: FriendResponse }) => (
    <TouchableOpacity
      style={[styles.userRow, { borderBottomColor: c.divider }]}
      onLongPress={() => handleRemove(item.id, item.user.nickname)}
      activeOpacity={0.9}
    >
      <View style={[styles.avatar, { backgroundColor: c.primaryBg }]}>
        {item.user.profileImage
          ? <Image source={{ uri: item.user.profileImage }} style={styles.avatarImg} />
          : <Ionicons name="person" size={20} color={c.primary} />}
      </View>
      <Text style={[styles.nickname, { color: c.textPrimary }]}>{item.user.nickname}</Text>
      <Ionicons name="ellipsis-horizontal" size={16} color={c.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{
        title: '친구',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={24} color={c.textPrimary} />
          </TouchableOpacity>
        ),
      }} />
      {/* 검색 */}
      <View style={[styles.searchWrap, { backgroundColor: c.searchBg }]}>
        <Ionicons name="search-outline" size={17} color={c.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: c.textPrimary }]}
          placeholder="닉네임으로 친구 검색 (2자 이상)"
          placeholderTextColor={c.textDisabled}
          value={searchQuery}
          onChangeText={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
            <Ionicons name="close-circle" size={17} color={c.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* 검색 결과 */}
      {isSearching ? (
        searching ? (
          <View style={styles.centered}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => String(item.id)}
            renderItem={renderSearchResult}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
            ListEmptyComponent={
              <View style={styles.centered}>
                <Text style={[styles.emptyText, { color: c.textTertiary }]}>검색 결과가 없어요</Text>
              </View>
            }
          />
        )
      ) : (
        <>
          {/* 탭 */}
          <View style={[styles.tabs, { borderBottomColor: c.divider }]}>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'friends' && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
              onPress={() => { lightTap(); setTab('friends'); }}
            >
              <Text style={[styles.tabText, { color: tab === 'friends' ? c.primary : c.textSecondary }]}>
                친구 {friends.length > 0 ? friends.length : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'requests' && { borderBottomColor: c.primary, borderBottomWidth: 2 }]}
              onPress={() => { lightTap(); setTab('requests'); }}
            >
              <Text style={[styles.tabText, { color: tab === 'requests' ? c.primary : c.textSecondary }]}>
                받은 요청 {requests.length > 0 ? requests.length : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={c.primary} />
            </View>
          ) : tab === 'friends' ? (
            <FlatList
              data={friends}
              keyExtractor={item => String(item.id)}
              renderItem={renderFriend}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
              ListEmptyComponent={
                <Animated.View entering={FadeIn.duration(300)} style={styles.emptyWrap}>
                  <Ionicons name="people-outline" size={56} color={c.textDisabled} />
                  <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>아직 친구가 없어요</Text>
                  <Text style={[styles.emptyDesc, { color: c.textTertiary }]}>
                    닉네임을 검색해서{'\n'}친구를 추가해보세요!
                  </Text>
                </Animated.View>
              }
            />
          ) : (
            <FlatList
              data={requests}
              keyExtractor={item => String(item.id)}
              renderItem={renderRequest}
              contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Ionicons name="mail-outline" size={56} color={c.textDisabled} />
                  <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>받은 친구 요청이 없어요</Text>
                </View>
              }
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 0 },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    marginTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: { fontSize: 14, fontWeight: '600' },

  // List
  listContent: { paddingTop: 4 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  nickname: { flex: 1, fontSize: 15, fontWeight: '500' },

  // Status badge
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Add button
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  addBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Request actions
  requestHint: { fontSize: 12, marginTop: 2 },
  requestActions: { flexDirection: 'row', gap: 8 },
  rejectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  rejectBtnText: { fontSize: 13, fontWeight: '600' },
  acceptBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  acceptBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },

  // Empty
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyWrap: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  emptyText: { fontSize: 14 },
});
