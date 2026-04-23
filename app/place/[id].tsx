import { StyleSheet, View, Text, ScrollView, FlatList, TouchableOpacity, Platform, RefreshControl, Linking, Dimensions, Modal, Pressable, ActivityIndicator, Share, ActionSheetIOS, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PlaceDetail, Comment, PlaceCategory } from '../../types';
import { placeApi } from '../../api/place';
import { commentApi } from '../../api/comment';
import { blockApi } from '../../api/block';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { lightTap } from '../../utils/haptics';
import { TaggedContent } from '../../components/TaggedContent';
import Skeleton from '../../components/Skeleton';
import { CategoryPlaceholder } from '../../components/CategoryPlaceholder';
import { ReportModal } from '../../components/ReportModal';
import { PlaceTagStats } from '../../components/PlaceTagStats';
import { placeCategoryApi } from '../../api/placeCategory';
import { showSuccess, showError } from '../../utils/toast';
import { getErrorMessage } from '../../utils/getErrorMessage';

export default function PlaceDetailScreen() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();

  const [place, setPlace] = useState<PlaceDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  // Keyset cursor: 마지막으로 받은 댓글의 (createdAt, id). null이면 첫 페이지.
  const [commentCursor, setCommentCursor] = useState<{ cursorCreatedAt: string; cursorId: number } | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [placeCategories, setPlaceCategories] = useState<PlaceCategory[]>([]);
  const [reportTarget, setReportTarget] = useState<Comment | null>(null);
  const [photoOnly, setPhotoOnly] = useState(false);

  const fetchPlace = useCallback(async () => {
    try {
      const data = await placeApi.getPlaceDetail(Number(id));
      setPlace(data);
    } catch (error) {
      console.error('Failed to fetch place:', error);
    }
  }, [id]);

  // reset=true면 커서를 무시하고 처음부터 다시 조회, false면 cursor 이후 페이지를 이어 조회.
  const fetchComments = useCallback(async (cursor: { cursorCreatedAt: string; cursorId: number } | null, reset = false) => {
    try {
      const data = await commentApi.getComments(Number(id), 20, cursor ?? undefined);
      setComments(prev => reset ? data.content : [...prev, ...data.content]);
      setHasMoreComments(!data.last);
      const last = data.content.at(-1);
      setCommentCursor(last ? { cursorCreatedAt: last.createdAt, cursorId: last.id } : null);
    } catch {}
  }, [id]);

  useEffect(() => {
    (async () => {
      await Promise.all([fetchPlace(), fetchComments(null, true)]);
      setLoading(false);
    })();
  }, [fetchPlace, fetchComments]);

  useEffect(() => { placeCategoryApi.getPlaceCategories().then(setPlaceCategories).catch(() => {}); }, []);

  // 화면 복귀 시 place만 조용히 재조회 (깜박임 없이 isVisited 등 갱신)
  useFocusEffect(useCallback(() => {
    if (!loading) fetchPlace();
  }, [loading, fetchPlace]));

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchPlace(), fetchComments(null, true)]);
    } catch {} finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchPlace, fetchComments]);

  const loadMoreComments = useCallback(async () => {
    if (!hasMoreComments || loadingMore || !commentCursor) return;
    setLoadingMore(true);
    await fetchComments(commentCursor);
    setLoadingMore(false);
  }, [hasMoreComments, loadingMore, commentCursor, fetchComments]);

  const handleOpenNaverMap = async () => {
    if (!place) return;
    lightTap();
    const appUrl = `nmap://place?lat=${place.lat}&lng=${place.lng}&name=${encodeURIComponent(place.name)}&appname=com.wishmap.app`;
    // naverPlaceId가 순수 숫자인 경우만 플레이스 URL 사용 (좌표 형식 제외)
    const isPlaceId = place.naverPlaceId && /^\d+$/.test(place.naverPlaceId);
    const webUrl = isPlaceId
      ? `https://m.place.naver.com/place/${place.naverPlaceId}/home`
      : `https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const handleVisit = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    lightTap();
    router.push({
      pathname: '/visit-review',
      params: {
        placeName: place?.name || '',
        placeLat: String(place?.lat || ''),
        placeLng: String(place?.lng || ''),
        placeId: place?.naverPlaceId || '',
        placeCategory: place?.category || '',
        existingPlaceId: String(place?.id || ''),
        placeCategoryId: place?.placeCategoryId ? String(place.placeCategoryId) : '',
      },
    });
  };

  const handleShare = async () => {
    if (!place) return;
    lightTap();
    const isPlaceId = place.naverPlaceId && /^\d+$/.test(place.naverPlaceId);
    const url = isPlaceId
      ? `https://m.place.naver.com/place/${place.naverPlaceId}/home`
      : `https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`;
    try {
      await Share.share({
        message: `${place.name}${place.category ? ` (${place.category})` : ''}\n${url}`,
      });
    } catch {}
  };

  const activeComments = comments.filter(r =>
    !r.isDeleted
    && (r.content || r.tags?.length > 0 || r.images?.length > 0)
    && (!photoOnly || r.images?.length > 0)
  );
  const hasAnyActiveComments = comments.some(r => !r.isDeleted && (r.content || r.tags?.length > 0 || r.images?.length > 0));

  const handleBlockUser = useCallback((comment: Comment) => {
    Alert.alert(
      `${comment.user.nickname}님 차단`,
      '차단하면 해당 사용자의 방문 기록과 댓글이 더 이상 보이지 않습니다. 마이페이지 > 차단 목록에서 해제할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '차단',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockApi.block(comment.user.id);
              setComments(prev => prev.filter(c => c.user.id !== comment.user.id));
              showSuccess('차단 완료', `${comment.user.nickname}님을 차단했습니다`);
            } catch (e) {
              showError('차단 실패', getErrorMessage(e));
            }
          },
        },
      ],
    );
  }, []);

  const handleOpenCommentMenu = useCallback((comment: Comment) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (comment.isMine) return;
    lightTap();

    const options = ['신고하기', `${comment.user.nickname}님 차단`, '취소'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 2,
          destructiveButtonIndex: 0,
          title: comment.user.nickname,
        },
        (index) => {
          if (index === 0) setReportTarget(comment);
          else if (index === 1) handleBlockUser(comment);
        },
      );
    } else {
      Alert.alert(
        comment.user.nickname,
        undefined,
        [
          { text: '신고하기', style: 'destructive', onPress: () => setReportTarget(comment) },
          { text: `${comment.user.nickname}님 차단`, onPress: () => handleBlockUser(comment) },
          { text: '취소', style: 'cancel' },
        ],
      );
    }
  }, [isAuthenticated, handleBlockUser]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface }]}>
        <Stack.Screen
          options={{
            title: '',
            headerStyle: { backgroundColor: c.headerBg },
            headerTintColor: c.textPrimary,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Skeleton width="100%" height={280} borderRadius={0} />
        <View style={styles.skeletonInfo}>
          <View style={styles.skeletonTitleRow}>
            <Skeleton width="60%" height={26} borderRadius={6} />
            <Skeleton width={60} height={24} borderRadius={6} />
          </View>
          <Skeleton width={80} height={14} borderRadius={4} />
          <Skeleton width="45%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
    );
  }

  if (!place) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.surface }]}>
        <Stack.Screen
          options={{
            title: '',
            headerStyle: { backgroundColor: c.headerBg },
            headerTintColor: c.textPrimary,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Ionicons name="alert-circle-outline" size={48} color={c.textDisabled} />
        <Text style={{ color: c.textSecondary, marginTop: 12 }}>장소 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: place.name,
          headerStyle: { backgroundColor: c.headerBg },
          headerTintColor: c.textPrimary,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          headerRight: ({ tintColor }) => (
            <TouchableOpacity
              onPress={handleShare}
              style={{ width: 36, height: 36, justifyContent: 'center', alignItems: 'center' }}
            >
              <Ionicons name="share-outline" size={24} color={tintColor} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: c.surface }]}>
        <FlatList
          data={activeComments}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />
          }
          onEndReached={loadMoreComments}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <>
              {/* 메인 이미지 */}
              {(() => {
                const allImages = place.images.length > 0
                  ? place.images
                  : place.thumbnailImage
                    ? [place.thumbnailImage]
                    : [];
                return allImages.length > 0 ? (
                  <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                    {allImages.map((uri, i) => (
                      <Image key={i} source={{ uri }} style={[styles.mainImage, { backgroundColor: c.imagePlaceholderBg }]} contentFit="contain" />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={[styles.mainImage, styles.imagePlaceholder]}>
                    <CategoryPlaceholder
                      icon={placeCategories.find(cat => cat.id === place.placeCategoryId)?.icon}
                      size={Dimensions.get('window').width}
                      iconScale={0.2}
                    />
                  </View>
                );
              })()}

              {/* 기본 정보 */}
              <View style={[styles.infoSection, { borderBottomColor: c.background }]}>
                <View style={styles.header}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.name, { color: c.textPrimary }]}>{place.name}</Text>
                    {place.category && (
                      <Text style={[styles.category, { backgroundColor: c.categoryBadgeBg, color: c.categoryBadgeText }]}>{place.category}</Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <Text style={[styles.visitCountBadge, { color: c.textSecondary }]}>방문 {place.visitCount}회</Text>
                  </View>
                  {place.lastVisitedAt && (
                    <Text style={[styles.lastVisitText, { color: c.textTertiary }]}>
                      최근 방문 {new Date(place.lastVisitedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {new Date(place.lastVisitedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.naverMapLink}
                  onPress={handleOpenNaverMap}
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate-outline" size={16} color="#1EC800" />
                  <Text style={[styles.naverMapLinkText, { color: c.textSecondary }]}>길찾기</Text>
                  <Ionicons name="open-outline" size={12} color={c.textDisabled} />
                </TouchableOpacity>

                {place.description && (
                  <Text style={[styles.description, { color: c.textPrimary }]}>{place.description}</Text>
                )}
              </View>

              {/* 인기 태그 집계 */}
              <PlaceTagStats stats={place.topTags ?? []} />

              {/* 방문 기록 타이틀 */}
              {hasAnyActiveComments && (
                <View style={[styles.visitLogSection, { borderTopColor: c.background }]}>
                  <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
                    방문 기록 {activeComments.length}개
                  </Text>
                  <TouchableOpacity
                    onPress={() => { lightTap(); setPhotoOnly(v => !v); }}
                    activeOpacity={0.8}
                    style={[
                      styles.filterChip,
                      photoOnly
                        ? { backgroundColor: c.primaryBg }
                        : { backgroundColor: c.chipBg },
                    ]}
                    accessibilityLabel="사진 있는 기록만 보기"
                  >
                    <Ionicons
                      name="images-outline"
                      size={13}
                      color={photoOnly ? c.primary : c.textSecondary}
                    />
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: photoOnly ? c.primary : c.textSecondary },
                      ]}
                    >
                      사진만
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="people-outline" size={40} color={c.textDisabled} />
                <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>
                  {photoOnly && hasAnyActiveComments
                    ? '사진이 있는 방문 기록이 없어요'
                    : '아직 방문 기록이 없어요'}
                </Text>
                <Text style={[styles.emptyDesc, { color: c.textTertiary }]}>
                  {photoOnly && hasAnyActiveComments
                    ? '필터를 해제하면 전체 기록을 볼 수 있어요'
                    : '첫 방문자가 되어보세요'}
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.visitLogItem, { borderBottomColor: c.divider, marginHorizontal: 20 }]}>
              <View style={styles.visitLogHeader}>
                <View style={styles.visitLogAuthorRow}>
                  {item.user.profileImage ? (
                    <Image
                      source={{ uri: item.user.profileImage }}
                      style={[styles.avatar, { backgroundColor: c.imagePlaceholderBg }]}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.chipBg }]}>
                      <Text style={[styles.avatarInitial, { color: c.textSecondary }]}>
                        {item.user.nickname?.[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                  )}
                  <Text style={[styles.visitLogAuthor, { color: c.textPrimary }]}>{item.user.nickname}</Text>
                  {item.userVisitCount > 0 && (
                    <View style={[styles.visitBadge, { backgroundColor: c.chipBg }]}>
                      <Text style={[styles.visitBadgeText, { color: c.textTertiary }]}>
                        {item.userVisitCount}번 방문
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.visitLogRight}>
                  <Text style={[styles.visitLogDate, { color: c.textTertiary }]}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                  {!item.isMine && (
                    <TouchableOpacity
                      onPress={() => handleOpenCommentMenu(item)}
                      hitSlop={10}
                      style={styles.moreButton}
                      accessibilityLabel="더보기"
                    >
                      <Ionicons name="ellipsis-horizontal" size={16} color={c.textTertiary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {item.images?.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.visitLogImageRow}>
                  {item.images.map((img, idx) => (
                    <TouchableOpacity key={idx} onPress={() => setViewerImage(img)} activeOpacity={0.9}>
                      <Image source={{ uri: img }} style={styles.visitLogImage} contentFit="cover" />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {(item.content || item.tags?.length > 0) && (
                <TaggedContent content={item.content} tags={item.tags} />
              )}
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadingMoreWrap}>
                <ActivityIndicator size="small" color={c.textDisabled} />
              </View>
            ) : null
          }
        />

        {/* 하단 고정: 방문 인증 */}
        <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.divider }]}>
          <TouchableOpacity
            style={[
              styles.bottomButton,
              place.isVisited
                ? { backgroundColor: c.chipBg }
                : { backgroundColor: c.primary },
            ]}
            onPress={handleVisit}
            disabled={place.isVisited}
            activeOpacity={0.8}
          >
            {place.isVisited ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.bottomButtonText, { color: c.textSecondary }]}>오늘 인증 완료</Text>
              </>
            ) : (
              <>
                <Ionicons name="footsteps-outline" size={16} color="#fff" />
                <Text style={[styles.bottomButtonText, { color: '#fff' }]}>방문 인증</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* 신고 모달 */}
      <ReportModal
        visible={!!reportTarget}
        targetType="COMMENT"
        targetId={reportTarget?.id ?? 0}
        onClose={() => setReportTarget(null)}
      />

      {/* 이미지 확대 뷰어 */}
      <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <Pressable style={styles.viewerOverlay} onPress={() => setViewerImage(null)}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerImage(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {viewerImage && (
            <Image source={{ uri: viewerImage }} style={styles.viewerImage} contentFit="contain" />
          )}
        </Pressable>
      </Modal>
    </>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  mainImage: { width: SCREEN_WIDTH, aspectRatio: 4 / 3 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },

  infoSection: { padding: 20, borderBottomWidth: 8 },
  header: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '700', flex: 1 },
  category: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lastVisitText: { fontSize: 12, marginTop: 6 },
  visitCountBadge: { fontSize: 14, fontWeight: '600' },

  naverMapLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  naverMapLinkText: { fontSize: 13 },
  description: { fontSize: 15, lineHeight: 22 },

  // 방문 기록
  visitLogSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  filterChipText: { fontSize: 12, fontWeight: '600' },
  avatar: { width: 28, height: 28, borderRadius: 14 },
  avatarFallback: { justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { fontSize: 13, fontWeight: '700' },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600' },
  emptyDesc: { fontSize: 12 },
  loadingMoreWrap: { paddingVertical: 20, alignItems: 'center' },
  visitLogItem: { paddingVertical: 16, borderBottomWidth: 0.5 },
  visitLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  visitLogAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  visitLogAuthor: { fontSize: 14, fontWeight: '600' },
  visitBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  visitBadgeText: { fontSize: 11, fontWeight: '500' },
  visitLogDate: { fontSize: 11 },
  visitLogRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moreButton: { padding: 2 },
  visitLogImageRow: { marginBottom: 10 },
  visitLogImage: { height: 160, aspectRatio: 3 / 4, borderRadius: 10, marginRight: 8 },

  // 이미지 뷰어
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerClose: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: SCREEN_WIDTH, height: Dimensions.get('window').height * 0.7 },

  // 하단 고정 바
  bottomBar: {
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 0.5,
  },
  bottomButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12,
  },
  bottomButtonText: { fontSize: 14, fontWeight: '600' },

  // 스켈레톤
  skeletonInfo: { padding: 20, gap: 10 },
  skeletonTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skeletonNavRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  skeletonMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
