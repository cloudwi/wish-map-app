import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, FlatList,
  Alert, Modal, RefreshControl, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { SearchInput } from '../components/SearchInput';
import { lunchVoteApi, LunchVoteCandidateResponse } from '../api/lunchVote';
import { placeApi } from '../api/place';
import { Place } from '../types';
import { lightTap, successTap, mediumTap } from '../utils/haptics';
import { showError, showSuccess } from '../utils/toast';
import { CategoryPlaceholder } from '../components/CategoryPlaceholder';


export default function LunchVoteScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { groupId } = useLocalSearchParams<{ groupId: string; groupName: string }>();
  const gid = Number(groupId);
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);

  // 투표 데이터
  const { data: vote, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['lunchVote', gid],
    queryFn: () => lunchVoteApi.getActiveVote(gid),
    refetchInterval: 15000,
    enabled: !!gid,
  });

  // 카운트다운
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    if (!vote || vote.status !== 'ACTIVE') return;
    const update = () => {
      const diff = new Date(vote.deadline).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft('마감'); refetch(); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(h > 0 ? `${h}시간 ${m}분` : `${m}분 ${s}초`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [vote?.deadline, vote?.status]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (deadline: string) => lunchVoteApi.createVote(gid, deadline),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lunchVote', gid] }); successTap(); showSuccess('투표가 시작되었어요!'); },
    onError: () => showError('투표 생성 실패', '이미 진행 중인 투표가 있습니다.'),
  });

  const voteMutation = useMutation({
    mutationFn: (candidateId: number) => lunchVoteApi.castVote(gid, candidateId),
    onSuccess: (data) => { queryClient.setQueryData(['lunchVote', gid], data); successTap(); },
    onError: () => showError('투표 실패', '다시 시도해주세요.'),
  });

  const addCandidateMutation = useMutation({
    mutationFn: (placeId: number) => lunchVoteApi.addCandidate(gid, placeId),
    onSuccess: (data) => {
      queryClient.setQueryData(['lunchVote', gid], data);
      showSuccess('후보가 추가되었어요!');
      setShowAddModal(false);
    },
    onError: () => showError('추가 실패', '이미 추가된 장소입니다.'),
  });

  const closeMutation = useMutation({
    mutationFn: () => lunchVoteApi.closeVote(gid),
    onSuccess: (data) => { queryClient.setQueryData(['lunchVote', gid], data); showSuccess('투표가 마감되었습니다'); },
    onError: () => showError('마감 실패', '권한이 없습니다.'),
  });

  // 투표 생성
  const handleCreate = () => {
    mediumTap();
    const now = new Date();
    const deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 30, 0);
    if (deadline.getTime() <= now.getTime()) {
      deadline.setDate(deadline.getDate() + 1);
    }
    createMutation.mutate(deadline.toISOString());
  };

  // 맛집 검색
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 1) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await placeApi.getPlaces({ search: query.trim(), size: 20 });
      setSearchResults(res.content);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  }, []);

  // 수동 마감
  const handleClose = () => {
    Alert.alert('투표 마감', '투표를 마감하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '마감', style: 'destructive', onPress: () => closeMutation.mutate() },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ title: '점심 투표' }} />
        <View style={styles.loadingWrap}><ActivityIndicator size="large" color={c.primary} /></View>
      </View>
    );
  }

  // 투표 없음 → 생성 화면
  if (!vote) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ title: '점심 투표' }} />
        <View style={styles.emptyWrap}>
          <Ionicons name="restaurant-outline" size={64} color={c.textDisabled} />
          <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>진행 중인 투표가 없어요</Text>
          <Text style={[styles.emptyDesc, { color: c.textTertiary }]}>투표를 시작하고 점심 메뉴를 정해보세요</Text>
          <TouchableOpacity
            style={[styles.createBtn, { backgroundColor: c.primary }]}
            onPress={handleCreate}
            activeOpacity={0.8}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.createBtnText}>투표 시작하기</Text>
              </>
            )}
          </TouchableOpacity>
          <Text style={[styles.deadlineHint, { color: c.textDisabled }]}>마감: 오늘 오전 11:30</Text>
        </View>
      </View>
    );
  }

  const isClosed = vote.status === 'CLOSED';
  const winner = isClosed && vote.candidates.length > 0 ? vote.candidates[0] : null;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{
        title: '점심 투표',
        headerRight: isClosed ? undefined : () => (
          <TouchableOpacity onPress={handleClose} style={{ paddingHorizontal: 8 }}>
            <Text style={{ color: c.error, fontSize: 15, fontWeight: '600' }}>마감</Text>
          </TouchableOpacity>
        ),
      }} />

      <FlatList
        data={vote.candidates}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[c.primary]} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={[styles.voteTitle, { color: c.textPrimary }]}>{vote.title}</Text>
            <View style={styles.statusRow}>
              {isClosed ? (
                <View style={[styles.statusBadge, { backgroundColor: c.textDisabled }]}>
                  <Text style={styles.statusText}>마감됨</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: c.primary }]}>
                  <Ionicons name="time-outline" size={13} color="#fff" />
                  <Text style={styles.statusText}>{timeLeft} 남음</Text>
                </View>
              )}
              <Text style={[styles.voteCount, { color: c.textTertiary }]}>{vote.totalVotes}명 투표</Text>
            </View>
            {isClosed && winner && (
              <View style={[styles.winnerBanner, { backgroundColor: c.primaryBg }]}>
                <Ionicons name="trophy" size={20} color={c.primary} />
                <Text style={[styles.winnerText, { color: c.primary }]}>오늘의 점심: {winner.restaurant.name}</Text>
              </View>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <CandidateCard
            candidate={item}
            isMyVote={vote.myVoteCandidateId === item.id}
            isClosed={isClosed}
            isWinner={isClosed && index === 0 && item.voteCount > 0}
            onVote={() => { lightTap(); voteMutation.mutate(item.id); }}
            c={c}
          />
        )}
        ListEmptyComponent={
          !isClosed ? (
            <View style={styles.emptyCandidates}>
              <Text style={[styles.emptyCandidatesText, { color: c.textDisabled }]}>아직 후보가 없어요. 맛집을 추가해주세요!</Text>
            </View>
          ) : null
        }
      />

      {/* 하단 버튼 */}
      {!isClosed ? (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: c.background, borderTopColor: c.border }]}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: c.primary }]}
            onPress={() => { lightTap(); setShowAddModal(true); }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>맛집 추가</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12, backgroundColor: c.background, borderTopColor: c.border }]}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: c.primary }]}
            onPress={handleCreate}
            activeOpacity={0.8}
            disabled={createMutation.isPending}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.addBtnText}>새 투표 시작</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 맛집 추가 모달 */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: c.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ padding: 4 }}>
              <Ionicons name="close" size={26} color={c.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: c.textPrimary }]}>맛집 추가</Text>
            <View style={{ width: 34 }} />
          </View>
          <SearchInput
            value={searchQuery}
            onChangeText={handleSearch}
            onClear={() => { setSearchQuery(''); setSearchResults([]); }}
            placeholder="장소 이름 검색"
            autoFocus
            containerStyle={styles.searchWrap}
          />
          {searching && <ActivityIndicator style={{ marginTop: 20 }} color={c.primary} />}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => {
              const alreadyAdded = vote?.candidates.some(cand => cand.restaurant.id === item.id);
              return (
                <TouchableOpacity
                  style={[styles.searchItem, { borderBottomColor: c.border }]}
                  onPress={() => { if (!alreadyAdded) addCandidateMutation.mutate(item.id); }}
                  disabled={alreadyAdded || addCandidateMutation.isPending}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.searchItemName, { color: c.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.searchItemCategory, { color: c.textTertiary }]}>
                      {item.category ? `${item.category} · ` : ''}방문 {item.visitCount}회
                    </Text>
                  </View>
                  {alreadyAdded ? (
                    <Ionicons name="checkmark-circle" size={22} color={c.textDisabled} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color={c.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              searchQuery.length > 0 && !searching ? (
                <Text style={[styles.noResults, { color: c.textDisabled }]}>검색 결과가 없습니다</Text>
              ) : null
            }
          />
        </View>
      </Modal>
    </View>
  );
}

// 후보 카드 컴포넌트
function CandidateCard({ candidate, isMyVote, isClosed, isWinner, onVote, c }: {
  candidate: LunchVoteCandidateResponse;
  isMyVote: boolean;
  isClosed: boolean;
  isWinner: boolean;
  onVote: () => void;
  c: any;
}) {
  const r = candidate.restaurant;

  return (
    <TouchableOpacity
      style={[
        styles.candidateCard,
        { backgroundColor: c.cardBg, borderColor: isMyVote ? c.primary : c.border },
        isMyVote && { borderWidth: 2 },
        isWinner && { borderColor: c.primary, borderWidth: 2 },
      ]}
      onPress={isClosed ? undefined : onVote}
      activeOpacity={isClosed ? 1 : 0.7}
      disabled={isClosed}
    >
      <View style={styles.candidateContent}>
        {r.thumbnailImage ? (
          <Image source={{ uri: r.thumbnailImage }} style={styles.candidateImage} contentFit="cover" />
        ) : (
          <View style={[styles.candidateImage, { justifyContent: 'center', alignItems: 'center' }]}>
            <CategoryPlaceholder size={50} />
          </View>
        )}
        <View style={styles.candidateInfo}>
          <View style={styles.candidateNameRow}>
            <Text style={[styles.candidateName, { color: c.textPrimary }]} numberOfLines={1}>{r.name}</Text>
            {isWinner && <Ionicons name="trophy" size={16} color={c.primary} />}
          </View>
          {r.category && <Text style={[styles.candidateCategory, { color: c.textTertiary }]} numberOfLines={1}>{r.category}</Text>}
          {candidate.voters.length > 0 && (
            <Text style={[styles.voterNames, { color: c.textSecondary }]} numberOfLines={1}>
              {candidate.voters.join(', ')}
            </Text>
          )}
        </View>
        <View style={styles.voteCountWrap}>
          {isMyVote && !isClosed && (
            <View style={[styles.myVoteBadge, { backgroundColor: c.primary }]}>
              <Ionicons name="checkmark" size={10} color="#fff" />
            </View>
          )}
          <Text style={[styles.voteCountNum, { color: isMyVote ? c.primary : c.textSecondary }]}>{candidate.voteCount}</Text>
          <Text style={[styles.voteCountLabel, { color: c.textDisabled }]}>표</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // 빈 상태
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', marginTop: 16 },
  emptyDesc: { fontSize: 14, textAlign: 'center' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 8, marginTop: 20 },
  createBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  deadlineHint: { fontSize: 12, marginTop: 8 },

  // 헤더
  header: { marginBottom: 16 },
  voteTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  statusText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  voteCount: { fontSize: 13 },
  winnerBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 10, marginTop: 4 },
  winnerText: { fontSize: 16, fontWeight: '700' },

  // 리스트
  listContent: { padding: 16 },

  // 후보 카드
  candidateCard: { borderRadius: 10, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  candidateContent: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  candidateImage: { width: 50, height: 50, borderRadius: 8 },
  candidateInfo: { flex: 1, gap: 2 },
  candidateNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  candidateName: { fontSize: 15, fontWeight: '600', flex: 1 },
  candidateCategory: { fontSize: 12 },
  voterNames: { fontSize: 11, marginTop: 2 },
  voteCountWrap: { alignItems: 'center', minWidth: 36, gap: 2 },
  voteCountNum: { fontSize: 20, fontWeight: '700' },
  voteCountLabel: { fontSize: 11 },
  myVoteBadge: { width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  emptyCandidates: { padding: 40, alignItems: 'center' },
  emptyCandidatesText: { fontSize: 14 },

  // 하단 바
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 0.5 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 8 },
  addBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  // 모달
  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  searchWrap: { marginHorizontal: 16, marginTop: 12 },
  searchItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 0.5, gap: 12 },
  searchItemName: { fontSize: 15, fontWeight: '600' },
  searchItemCategory: { fontSize: 12, marginTop: 2 },
  noResults: { textAlign: 'center', marginTop: 40, fontSize: 14 },
});
