import { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, Alert, ActivityIndicator, Modal, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { SearchInput } from '../components/SearchInput';
import { PromptModal } from '../components/PromptModal';
import { groupApi, GroupDetailResponse, GroupMemberResponse } from '../api/group';
import { searchPlaces, PlaceResult } from '../api/search';
import { friendApi, FriendResponse } from '../api/friend';
import { useGroupStore } from '../stores/groupStore';
import { useAuthStore } from '../stores/authStore';
import { lightTap, successTap } from '../utils/haptics';
import { showError, showSuccess } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';


export default function GroupManageScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { groups, fetchGroups, createGroup, selectGroup, selectedGroupId } = useGroupStore();
  const { user } = useAuthStore();
  const [selectedGroup, setSelectedGroup] = useState<GroupDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<FriendResponse[]>([]);
  const [invitingId, setInvitingId] = useState<number | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [localRadius, setLocalRadius] = useState<number | null>(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<PlaceResult[]>([]);
  const [locationSearching, setLocationSearching] = useState(false);
  const [createGroupModal, setCreateGroupModal] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleLocationSearch = useCallback((query: string) => {
    setLocationQuery(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 2) { setLocationResults([]); return; }
    searchTimerRef.current = setTimeout(async () => {
      setLocationSearching(true);
      try {
        const results = await searchPlaces(query);
        setLocationResults(results);
      } catch { setLocationResults([]); }
      finally { setLocationSearching(false); }
    }, 300);
  }, []);

  const handleSelectLocation = async (place: PlaceResult) => {
    if (!selectedGroup) return;
    try {
      await groupApi.updateLocation(selectedGroup.id, place.lat, place.lng, place.roadAddress || place.address || place.name);
      successTap();
      showSuccess('위치 설정 완료', `${place.name}으로 설정됐습니다.`);
      fetchGroups();
      setShowLocationSearch(false);
      setLocationQuery('');
      setLocationResults([]);
    } catch (e: unknown) {
      showError('오류', getErrorMessage(e));
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const loadGroupDetail = useCallback(async (groupId: number) => {
    setLoading(true);
    try {
      const detail = await groupApi.getGroupDetail(groupId);
      setSelectedGroup(detail);
    } catch (e: unknown) {
      showError('오류', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleKick = (member: GroupMemberResponse) => {
    Alert.alert('추방 확인', `'${member.nickname}' 님을 추방하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '추방', style: 'destructive', onPress: async () => {
          try {
            await groupApi.kickMember(selectedGroup!.id, member.userId);
            showSuccess('추방 완료', `'${member.nickname}' 님이 추방되었습니다.`);
            loadGroupDetail(selectedGroup!.id);
            fetchGroups();
          } catch (e: unknown) { showError('오류', getErrorMessage(e)); }
        },
      },
    ]);
  };

  const handleTransfer = (member: GroupMemberResponse) => {
    Alert.alert('그룹장 양도', `'${member.nickname}' 님에게 그룹장을 양도하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '양도', onPress: async () => {
          try {
            await groupApi.transferLeader(selectedGroup!.id, member.userId);
            showSuccess('양도 완료', `'${member.nickname}' 님이 새 그룹장입니다.`);
            loadGroupDetail(selectedGroup!.id);
            fetchGroups();
          } catch (e: unknown) { showError('오류', getErrorMessage(e)); }
        },
      },
    ]);
  };

  const handleLeave = () => {
    Alert.alert('그룹 탈퇴', '이 그룹에서 탈퇴하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴', style: 'destructive', onPress: async () => {
          try {
            await groupApi.leaveGroup(selectedGroup!.id);
            setSelectedGroup(null);
            fetchGroups();
            showSuccess('탈퇴 완료', '그룹에서 탈퇴했습니다.');
          } catch (e: unknown) { showError('오류', getErrorMessage(e)); }
        },
      },
    ]);
  };

  const isLeader = selectedGroup && user && selectedGroup.leaderId === user.id;

  const loadFriends = useCallback(async () => {
    try {
      const data = await friendApi.getFriends();
      setFriends(data);
    } catch {}
  }, []);

  const handleInviteFriend = async (nickname: string, userId: number) => {
    if (!selectedGroup) return;
    setInvitingId(userId);
    try {
      await groupApi.inviteMember(selectedGroup.id, nickname);
      successTap();
      showSuccess('초대 완료', `${nickname}님을 초대했습니다.`);
      loadGroupDetail(selectedGroup.id);
    } catch (e: unknown) {
      showError('초대 실패', getErrorMessage(e));
    } finally {
      setInvitingId(null);
    }
  };

  if (selectedGroup) {
    const memberIds = selectedGroup.members.map((m) => m.userId);
    const invitableFriends = friends.filter((f) => !memberIds.includes(f.user.id));

    return (
      <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setSelectedGroup(null); setShowInvite(false); setLocalRadius(null); }}>
            <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>{selectedGroup.name}</Text>
          {!isLeader ? (
            <TouchableOpacity onPress={handleLeave}>
              <Text style={{ color: '#F44336', fontWeight: '600', fontSize: 14 }}>탈퇴</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => { lightTap(); setShowInvite(!showInvite); if (!showInvite) loadFriends(); }}>
              <Ionicons name={showInvite ? 'close' : 'person-add-outline'} size={22} color={c.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* 친구 초대 패널 */}
        {showInvite && (
          <View style={[styles.invitePanel, { backgroundColor: c.cardBg, borderBottomColor: c.divider }]}>
            <Text style={[styles.invitePanelTitle, { color: c.textSecondary }]}>친구 초대</Text>
            {invitableFriends.length === 0 ? (
              <Text style={[styles.inviteEmpty, { color: c.textDisabled }]}>초대할 수 있는 친구가 없어요</Text>
            ) : (
              invitableFriends.map((f) => (
                <View key={f.id} style={[styles.inviteFriendRow, { borderBottomColor: c.divider }]}>
                  <View style={[styles.inviteAvatar, { backgroundColor: c.primaryBg }]}>
                    <Ionicons name="person" size={16} color={c.primary} />
                  </View>
                  <Text style={[styles.inviteFriendName, { color: c.textPrimary }]}>{f.user.nickname}</Text>
                  <TouchableOpacity
                    style={[styles.inviteFriendBtn, { backgroundColor: c.primary }]}
                    onPress={() => handleInviteFriend(f.user.nickname, f.user.id)}
                    disabled={invitingId === f.user.id}
                    activeOpacity={0.8}
                  >
                    {invitingId === f.user.id ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>초대</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* 점심 투표 */}
        <TouchableOpacity
          style={[styles.locationRow, { backgroundColor: c.cardBg, borderBottomColor: c.divider }]}
          onPress={() => { lightTap(); router.push({ pathname: '/lunch-vote', params: { groupId: String(selectedGroup.id), groupName: selectedGroup.name } }); }}
          activeOpacity={0.7}
        >
          <Ionicons name="restaurant-outline" size={18} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: c.textPrimary }}>점심 투표</Text>
            <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>오늘 점심 어디 갈까요?</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={c.textDisabled} />
        </TouchableOpacity>

        {/* 기본 위치 설정 (그룹장만) */}
        {isLeader && (
          <TouchableOpacity
            style={[styles.locationRow, { backgroundColor: c.cardBg, borderBottomColor: c.divider }]}
            onPress={() => { lightTap(); setShowLocationSearch(true); }}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={18} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[{ fontSize: 14, fontWeight: '500', color: c.textPrimary }]}>기본 위치</Text>
              {groups.find(g => g.id === selectedGroup.id)?.baseAddress ? (
                <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>
                  {groups.find(g => g.id === selectedGroup.id)?.baseAddress}
                </Text>
              ) : (
                <Text style={{ fontSize: 12, color: c.textDisabled, marginTop: 2 }}>설정하면 그룹 선택 시 해당 위치로 이동해요</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.textDisabled} />
          </TouchableOpacity>
        )}

        {/* 반경 선택 (그룹장 + 위치 설정 후) */}
        {isLeader && groups.find(g => g.id === selectedGroup.id)?.baseAddress && (
          <View style={[styles.radiusRow, { backgroundColor: c.cardBg, borderBottomColor: c.divider }]}>
            <Ionicons name="resize-outline" size={18} color={c.primary} />
            <Text style={{ fontSize: 14, fontWeight: '500', color: c.textPrimary, marginRight: 'auto' }}>반경</Text>
            {[300, 500, 1000].map((r) => {
              const currentRadius = localRadius ?? groups.find(g => g.id === selectedGroup.id)?.baseRadius ?? 1000;
              const isActive = currentRadius === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.radiusChip, { backgroundColor: isActive ? c.primary : c.chipBg, borderColor: isActive ? c.primary : c.border }]}
                  onPress={async () => {
                    lightTap();
                    const group = groups.find(g => g.id === selectedGroup.id);
                    if (!group?.baseLat || !group?.baseLng) return;
                    try {
                      setLocalRadius(r);
                      await groupApi.updateLocation(selectedGroup.id, group.baseLat, group.baseLng, group.baseAddress || '', r);
                      successTap();
                      fetchGroups();
                    } catch (e: unknown) { setLocalRadius(null); showError('오류', getErrorMessage(e)); }
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: isActive ? '#fff' : c.textSecondary }}>
                    {r >= 1000 ? `${r / 1000}km` : `${r}m`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* 위치 검색 모달 */}
        <Modal visible={showLocationSearch} animationType="slide" presentationStyle="pageSheet">
          <View
            style={[styles.container, { backgroundColor: c.background, paddingTop: Platform.OS === 'ios' ? 20 : insets.top }]}
          >
            <View style={[styles.header, { paddingTop: 12 }]}>
              <TouchableOpacity onPress={() => { setShowLocationSearch(false); setLocationQuery(''); setLocationResults([]); }}>
                <Ionicons name="close" size={24} color={c.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.headerTitle, { color: c.textPrimary }]}>기본 위치 설정</Text>
              <View style={{ width: 24 }} />
            </View>
            <SearchInput
              value={locationQuery}
              onChangeText={handleLocationSearch}
              onClear={() => { setLocationQuery(''); setLocationResults([]); }}
              placeholder="주소 또는 장소명 검색 (예: 교대역)"
              autoFocus
              size="sm"
              containerStyle={styles.locationSearchBar}
            />
            {locationSearching && <ActivityIndicator style={{ marginTop: 20 }} color={c.primary} />}
            <FlatList
              data={locationResults}
              keyExtractor={(item, i) => `${item.name}-${i}`}
              contentContainerStyle={{ padding: 16 }}
              automaticallyAdjustKeyboardInsets
              contentInsetAdjustmentBehavior="automatic"
              keyboardDismissMode="interactive"
              ListHeaderComponent={
                locationResults.length > 0 && locationQuery.length >= 2 ? (
                  <TouchableOpacity
                    style={[styles.locationQuickSet, { backgroundColor: c.primary + '12', borderColor: c.primary + '30' }]}
                    onPress={async () => {
                      if (!selectedGroup || locationResults.length === 0) return;
                      const place = locationResults[0];
                      try {
                        await groupApi.updateLocation(selectedGroup.id, place.lat, place.lng, locationQuery);
                        successTap();
                        showSuccess('위치 설정 완료', `'${locationQuery}' 근처로 설정됐습니다.`);
                        fetchGroups();
                        setShowLocationSearch(false);
                        setLocationQuery('');
                        setLocationResults([]);
                      } catch (e: unknown) { showError('오류', getErrorMessage(e)); }
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="navigate" size={18} color={c.primary} />
                    <Text style={{ fontSize: 14, fontWeight: '600', color: c.primary }}>
                      &lsquo;{locationQuery}&rsquo; 근처로 설정
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.locationResultItem, { borderBottomColor: c.divider }]}
                  onPress={() => handleSelectLocation(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location-outline" size={18} color={c.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[{ fontSize: 14, fontWeight: '500', color: c.textPrimary }]}>{item.name}</Text>
                    <Text style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>{item.roadAddress || item.address}</Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                locationQuery.length >= 2 && !locationSearching ? (
                  <Text style={{ textAlign: 'center', paddingVertical: 30, color: c.textDisabled, fontSize: 14 }}>검색 결과가 없어요</Text>
                ) : null
              }
            />
          </View>
        </Modal>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={c.primary} />
        ) : (
          <FlatList
            data={selectedGroup.members}
            keyExtractor={(m) => m.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <View style={[styles.memberRow, { borderBottomColor: c.divider }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.memberName, { color: c.textPrimary }]}>{item.nickname}</Text>
                    {item.role === 'LEADER' && (
                      <View style={[styles.leaderBadge, { backgroundColor: c.primary + '20' }]}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: c.primary }}>그룹장</Text>
                      </View>
                    )}
                  </View>
                </View>
                {isLeader && item.role !== 'LEADER' && (
                  <TouchableOpacity
                    onPress={() => {
                      lightTap();
                      Alert.alert(
                        item.nickname,
                        '멤버 관리',
                        [
                          { text: '그룹장 양도', onPress: () => handleTransfer(item) },
                          { text: '추방', style: 'destructive', onPress: () => handleKick(item) },
                          { text: '취소', style: 'cancel' },
                        ]
                      );
                    }}
                    hitSlop={8}
                    style={{ padding: 8 }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={16} color={c.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>그룹 관리</Text>
        <TouchableOpacity
          onPress={() => {
            lightTap();
            setCreateGroupModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={26} color={c.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g) => g.id.toString()}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: c.textDisabled }]}>
            아직 그룹이 없어요. 새 그룹을 만들어보세요!
          </Text>
        }
        renderItem={({ item }) => {
          const isSelected = selectedGroupId === item.id;
          return (
            <View
              style={[styles.groupItem, { backgroundColor: c.cardBg },
                isSelected && { borderWidth: 1, borderColor: c.primary }]}
            >
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}
                onPress={() => {
                  lightTap();
                  selectGroup(item.id);
                  router.back();
                }}
                activeOpacity={0.7}
              >
                {isSelected ? (
                  <Ionicons name="checkmark-circle" size={20} color={c.primary} />
                ) : (
                  <Ionicons name="radio-button-off" size={20} color={c.textDisabled} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.groupName, { color: c.textPrimary }]}>{item.name}</Text>
                  <Text style={{ fontSize: 12, color: c.textTertiary }}>{item.memberCount}명 {item.isLeader ? '(그룹장)' : ''}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { lightTap(); loadGroupDetail(item.id); }}
                hitSlop={8}
                style={{ padding: 8 }}
              >
                <Ionicons name="settings-outline" size={18} color={c.textTertiary} />
              </TouchableOpacity>
            </View>
          );
        }}
      />
      <PromptModal
        visible={createGroupModal}
        title="새 그룹 만들기"
        subtitle="그룹 이름을 입력해주세요"
        placeholder="예: 회사 점심팀"
        maxLength={20}
        submitLabel="만들기"
        onClose={() => setCreateGroupModal(false)}
        onSubmit={async (name) => {
          try {
            const group = await createGroup(name);
            successTap();
            showSuccess('그룹 생성 완료', `'${group.name}' 그룹이 만들어졌습니다.`);
            setCreateGroupModal(false);
            loadGroupDetail(group.id);
          } catch (e: unknown) {
            showError('생성 실패', getErrorMessage(e));
          }
        }}
        validate={(v) => (!v ? '그룹 이름을 입력해주세요' : null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  createRow: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', gap: 8 },
  inviteRow: { paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', gap: 8 },
  inviteInput: { flex: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  inviteBtn: { paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  groupName: { fontSize: 15, fontWeight: '600' },
  emptyText: { textAlign: 'center', paddingVertical: 40, fontSize: 14 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  memberName: { fontSize: 15, fontWeight: '600' },
  leaderBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  locationQuickSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
  },
  locationSearchBar: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  locationResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 0.5,
  },
  radiusChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  invitePanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    maxHeight: 280,
  },
  invitePanelTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  inviteEmpty: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 16,
  },
  inviteFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  inviteAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteFriendName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  inviteFriendBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
});
