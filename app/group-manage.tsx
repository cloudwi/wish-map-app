import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { groupApi, GroupResponse, GroupDetailResponse, GroupMemberResponse } from '../api/group';
import { useGroupStore } from '../stores/groupStore';
import { useAuthStore } from '../stores/authStore';
import { lightTap, successTap } from '../utils/haptics';
import { showError, showSuccess } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function GroupManageScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { groups, fetchGroups, createGroup } = useGroupStore();
  const { user } = useAuthStore();
  const [selectedGroup, setSelectedGroup] = useState<GroupDetailResponse | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [inviteNickname, setInviteNickname] = useState('');
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    setCreating(true);
    try {
      const group = await createGroup(newGroupName.trim());
      setNewGroupName('');
      successTap();
      showSuccess('그룹 생성 완료', `'${group.name}' 그룹이 만들어졌습니다.`);
      loadGroupDetail(group.id);
    } catch (e: unknown) {
      showError('생성 실패', getErrorMessage(e));
    } finally {
      setCreating(false);
    }
  };

  const handleInvite = async () => {
    if (!selectedGroup || !inviteNickname.trim()) return;
    try {
      await groupApi.inviteMember(selectedGroup.id, inviteNickname.trim());
      setInviteNickname('');
      successTap();
      showSuccess('초대 완료', `'${inviteNickname.trim()}' 님을 초대했습니다.`);
      loadGroupDetail(selectedGroup.id);
    } catch (e: unknown) {
      showError('초대 실패', getErrorMessage(e));
    }
  };

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

  if (selectedGroup) {
    return (
      <View style={[styles.container, { backgroundColor: c.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedGroup(null)}>
            <Ionicons name="arrow-back" size={24} color={c.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: c.textPrimary }]}>{selectedGroup.name}</Text>
          {!isLeader && (
            <TouchableOpacity onPress={handleLeave}>
              <Text style={{ color: '#F44336', fontWeight: '600', fontSize: 14 }}>탈퇴</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 멤버 초대 */}
        <View style={[styles.inviteRow, { borderColor: c.border }]}>
          <TextInput
            style={[styles.inviteInput, { color: c.textPrimary, backgroundColor: c.inputBg }]}
            placeholder="닉네임으로 초대"
            placeholderTextColor={c.textDisabled}
            value={inviteNickname}
            onChangeText={setInviteNickname}
            returnKeyType="done"
            onSubmitEditing={handleInvite}
          />
          <TouchableOpacity style={[styles.inviteBtn, { backgroundColor: c.primary }]} onPress={handleInvite}>
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>초대</Text>
          </TouchableOpacity>
        </View>

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
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleTransfer(item)}>
                      <Text style={{ color: c.info, fontSize: 12, fontWeight: '600' }}>양도</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleKick(item)}>
                      <Text style={{ color: '#F44336', fontSize: 12, fontWeight: '600' }}>추방</Text>
                    </TouchableOpacity>
                  </View>
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
        <View style={{ width: 24 }} />
      </View>

      {/* 새 그룹 만들기 */}
      <View style={[styles.createRow, { borderColor: c.border }]}>
        <TextInput
          style={[styles.inviteInput, { color: c.textPrimary, backgroundColor: c.inputBg }]}
          placeholder="새 그룹 이름"
          placeholderTextColor={c.textDisabled}
          value={newGroupName}
          onChangeText={setNewGroupName}
          returnKeyType="done"
          onSubmitEditing={handleCreate}
        />
        <TouchableOpacity
          style={[styles.inviteBtn, { backgroundColor: c.primary }, creating && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={creating}
        >
          {creating ? <ActivityIndicator size="small" color="#fff" /> : (
            <Text style={{ color: '#fff', fontWeight: '600', fontSize: 13 }}>만들기</Text>
          )}
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
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.groupItem, { backgroundColor: c.cardBg }]}
            onPress={() => { lightTap(); loadGroupDetail(item.id); }}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={20} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.groupName, { color: c.textPrimary }]}>{item.name}</Text>
              <Text style={{ fontSize: 12, color: c.textTertiary }}>{item.memberCount}명 {item.isLeader ? '(그룹장)' : ''}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.textDisabled} />
          </TouchableOpacity>
        )}
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
});
