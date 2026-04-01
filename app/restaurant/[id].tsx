import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, RefreshControl, Linking, Dimensions, Modal, Pressable, ActionSheetIOS, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantDetail, Comment } from '../../types';
import { TaggedContent } from '../../components/TaggedContent';
import { restaurantApi } from '../../api/restaurant';
import { commentApi } from '../../api/comment';
import { searchPlaceImages } from '../../api/search';
import { blockApi } from '../../api/block';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { showError, showInfo, showSuccess } from '../../utils/toast';
import { mediumTap, lightTap, successTap } from '../../utils/haptics';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { ReportModal } from '../../components/ReportModal';
import RestaurantCardSkeleton from '../../components/RestaurantCardSkeleton';
import Skeleton from '../../components/Skeleton';

export default function RestaurantDetailScreen() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);
  const [searchImages, setSearchImages] = useState<string[]>([]);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'COMMENT' | 'RESTAURANT'; id: number } | null>(null);


  const fetchData = useCallback(async () => {
    try {
      const restaurantData = await restaurantApi.getRestaurantDetail(Number(id));
      setRestaurant(restaurantData);
      if (!restaurantData.thumbnailImage && restaurantData.images.length === 0) {
        searchPlaceImages(restaurantData.name + ' 맛집', 3).then(setSearchImages);
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    }
    try {
      const commentsData = await commentApi.getComments(Number(id));
      setComments(commentsData.content);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleOpenNaverMap = async () => {
    if (!restaurant) return;
    lightTap();
    const appUrl = `nmap://place?lat=${restaurant.lat}&lng=${restaurant.lng}&name=${encodeURIComponent(restaurant.name)}&appname=com.wishmap.app`;
    const webUrl = restaurant.naverPlaceId
      ? `https://m.place.naver.com/place/${restaurant.naverPlaceId}/home`
      : `https://map.naver.com/v5/search/${encodeURIComponent(restaurant.name)}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };


  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const comment = await commentApi.createComment(Number(id), newComment);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      successTap();
      setRestaurant(prev => prev ? {
        ...prev,
        commentCount: prev.commentCount + 1,
      } : null);
    } catch (error) {
      showError('오류', '리뷰 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisit = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      setVisitLoading(true);
      const Location = require('expo-location') as typeof import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await restaurantApi.verifyVisit(
        Number(id),
        location.coords.latitude,
        location.coords.longitude
      );
      successTap();
      setRestaurant(prev => prev ? {
        ...prev,
        isVisited: true,
        visitCount: (prev.visitCount ?? 0) + 1,
      } : null);
    } catch (error: any) {
      const message = error?.response?.data?.message || '방문 인증 중 오류가 발생했습니다.';
      showError('방문 인증 실패', message);
    } finally {
      setVisitLoading(false);
    }
  };

  const handleCommentAction = (comment: Comment) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    lightTap();
    const options = ['신고하기', '차단하기', '취소'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) setReportTarget({ type: 'COMMENT', id: comment.id });
          if (index === 1) handleBlockUser(comment.user.id, comment.user.nickname);
        },
      );
    } else {
      Alert.alert('', '', [
        { text: '신고하기', onPress: () => setReportTarget({ type: 'COMMENT', id: comment.id }) },
        { text: '차단하기', style: 'destructive', onPress: () => handleBlockUser(comment.user.id, comment.user.nickname) },
        { text: '취소', style: 'cancel' },
      ]);
    }
  };

  const handleBlockUser = (userId: number, nickname: string) => {
    Alert.alert('사용자 차단', `${nickname}님을 차단하시겠습니까?\n\n차단하면 이 사용자의 콘텐츠가 더 이상 표시되지 않습니다.`, [
      { text: '취소', style: 'cancel' },
      {
        text: '차단',
        style: 'destructive',
        onPress: async () => {
          try {
            await blockApi.block(userId);
            setComments(prev => prev.filter(c => c.user.id !== userId));
            showSuccess('차단 완료', `${nickname}님을 차단했습니다`);
          } catch (e: unknown) {
            showError('오류', getErrorMessage(e));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface }]}>
        {/* 이미지 영역 */}
        <Skeleton width="100%" height={280} borderRadius={0} />

        {/* 기본 정보 영역 */}
        <View style={styles.skeletonInfo}>
          <View style={styles.skeletonTitleRow}>
            <Skeleton width="60%" height={26} borderRadius={6} />
            <Skeleton width={60} height={24} borderRadius={6} />
          </View>
          <Skeleton width={80} height={14} borderRadius={4} />
          <Skeleton width="45%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
          <View style={styles.skeletonNavRow}>
            <Skeleton width={16} height={16} borderRadius={8} />
            <Skeleton width={50} height={14} borderRadius={4} />
          </View>
          <View style={styles.skeletonMeta}>
            <Skeleton width={80} height={12} borderRadius={4} />
            <Skeleton width={70} height={12} borderRadius={4} />
          </View>
        </View>

        {/* 구분선 */}
        <View style={{ height: 8, backgroundColor: c.background }} />

        {/* 리뷰 영역 */}
        <View style={styles.skeletonComments}>
          <Skeleton width={100} height={20} borderRadius={4} />
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.skeletonComment}>
              <View style={styles.skeletonCommentHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Skeleton width={24} height={24} borderRadius={12} />
                  <Skeleton width={60} height={14} borderRadius={4} />
                  <Skeleton width={40} height={18} borderRadius={10} />
                </View>
                <Skeleton width={60} height={12} borderRadius={4} />
              </View>
              <Skeleton width="95%" height={14} borderRadius={4} />
              <Skeleton width="70%" height={14} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.surface }]}>
        <Ionicons name="alert-circle-outline" size={48} color={c.textDisabled} />
        <Text style={{ color: c.textSecondary, marginTop: 12 }}>맛집 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: restaurant.name,
          headerStyle: { backgroundColor: c.headerBg },
          headerTintColor: c.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: c.surface }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />
          }
        >
          {/* 메인 이미지 */}
          {(() => {
            const allImages = restaurant.images.length > 0
              ? restaurant.images
              : restaurant.thumbnailImage
                ? [restaurant.thumbnailImage]
                : searchImages;
            return allImages.length > 0 ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {allImages.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={[styles.mainImage, { backgroundColor: c.imagePlaceholderBg }]} contentFit="cover" />
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.mainImage, styles.imagePlaceholder, { backgroundColor: c.imagePlaceholderBg }]}>
                <Ionicons name="restaurant-outline" size={48} color="#d4c4bc" />
              </View>
            );
          })()}

          {/* 기본 정보 */}
          <View style={[styles.infoSection, { borderBottomColor: c.background }]}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{restaurant.name}</Text>
                {restaurant.category && (
                  <Text style={[styles.category, { backgroundColor: c.categoryBadgeBg, color: c.categoryBadgeText }]}>{restaurant.category}</Text>
                )}
              </View>
              <View style={styles.actions}>
                <Text style={[styles.visitCountBadge, { color: c.textSecondary }]}>방문 {restaurant.visitCount}회</Text>
              </View>
            </View>

            {/* 길찾기 링크 */}
            <TouchableOpacity
              style={styles.naverMapLink}
              onPress={handleOpenNaverMap}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={16} color="#1EC800" />
              <Text style={[styles.naverMapLinkText, { color: c.textSecondary }]}>길찾기</Text>
              <Ionicons name="open-outline" size={12} color={c.textDisabled} />
            </TouchableOpacity>

            {restaurant.description && (
              <Text style={[styles.description, { color: c.textPrimary }]}>{restaurant.description}</Text>
            )}

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: c.textTertiary }]}>
                제안: {restaurant.suggestedBy.nickname}
              </Text>
              <Text style={[styles.metaText, { color: c.textTertiary }]}>
                {new Date(restaurant.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* 리뷰 섹션 */}
          <View style={styles.commentSection}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
              리뷰 {restaurant.commentCount}개
            </Text>

            {/* 리뷰 이미지 모아보기 */}
            {(() => {
              const allReviewImages = comments
                .filter(r => r.images?.length > 0 && !r.isDeleted)
                .flatMap(r => r.images);
              if (allReviewImages.length === 0) return null;
              return (
                <View style={styles.reviewGallery}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.reviewGalleryScroll}>
                    {allReviewImages.map((img, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setViewerImage(img)} activeOpacity={0.9}>
                        <Image source={{ uri: img }} style={styles.reviewGalleryImage} contentFit="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              );
            })()}

            {comments.filter(r => !r.isDeleted).map((comment) => (
              <View key={comment.id} style={[styles.commentItem, { borderBottomColor: c.divider }]}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthorRow}>
                    <Text style={[styles.commentAuthor, { color: c.textPrimary }]}>{comment.user.nickname}</Text>
                    {comment.userVisitCount > 0 && (
                      <View style={[styles.visitBadge, { backgroundColor: c.chipBg }]}>
                        <Text style={[styles.visitBadgeText, { color: c.textTertiary }]}>
                          {comment.userVisitCount}번 방문
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.commentDate, { color: c.textTertiary }]}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity onPress={() => handleCommentAction(comment)} hitSlop={8}>
                      <Ionicons name="ellipsis-horizontal" size={16} color={c.textDisabled} />
                    </TouchableOpacity>
                  </View>
                </View>
                {comment.images?.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImageRow}>
                    {comment.images.map((img, idx) => (
                      <TouchableOpacity key={idx} onPress={() => setViewerImage(img)} activeOpacity={0.9}>
                        <Image source={{ uri: img }} style={styles.reviewImage} contentFit="cover" />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                {comment.content ? <TaggedContent content={comment.content} /> : null}
              </View>
            ))}

            {comments.length === 0 && (
              <View style={styles.noCommentsWrap}>
                <Ionicons name="chatbubble-outline" size={32} color={c.textDisabled} />
                <Text style={[styles.noComments, { color: c.textSecondary }]}>
                  아직 리뷰가 없습니다. 첫 리뷰를 남겨보세요!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 고정: 방문인증 + 리뷰 작성 */}
        {restaurant && (
          <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.divider }]}>
            {/* 방문 인증 */}
            <TouchableOpacity
              style={[
                styles.bottomButton,
                restaurant.isVisited
                  ? { backgroundColor: c.chipBg }
                  : { borderWidth: 1, borderColor: c.primary },
              ]}
              onPress={handleVisit}
              disabled={restaurant.isVisited || visitLoading}
              activeOpacity={0.8}
            >
              {visitLoading ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : restaurant.isVisited ? (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  <Text style={[styles.bottomButtonText, { color: c.textSecondary }]}>인증 완료</Text>
                </>
              ) : (
                <>
                  <Ionicons name="footsteps-outline" size={16} color={c.primary} />
                  <Text style={[styles.bottomButtonText, { color: c.primary }]}>방문 인증</Text>
                </>
              )}
            </TouchableOpacity>

            {/* 리뷰 작성 */}
            <TouchableOpacity
              style={[styles.bottomButton, styles.bottomButtonPrimary, { backgroundColor: c.primary }]}
              onPress={() => {
                lightTap();
                router.push({
                  pathname: '/visit-review',
                  params: {
                    placeName: restaurant.name,
                    placeLat: String(restaurant.lat),
                    placeLng: String(restaurant.lng),
                    placeId: restaurant.naverPlaceId || '',
                    placeCategory: restaurant.category || '',
                  },
                });
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={[styles.bottomButtonText, { color: '#fff' }]}>리뷰 작성</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* 이미지 확대 뷰어 */}
      <Modal visible={!!viewerImage} transparent animationType="fade" onRequestClose={() => setViewerImage(null)}>
        <Pressable style={styles.viewerOverlay} onPress={() => setViewerImage(null)}>
          <TouchableOpacity style={styles.viewerClose} onPress={() => setViewerImage(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {viewerImage && (
            <Image
              source={{ uri: viewerImage }}
              style={styles.viewerImage}
              contentFit="contain"
            />
          )}
        </Pressable>
      </Modal>

      {/* 신고 모달 */}
      {reportTarget && (
        <ReportModal
          visible={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
        />
      )}
    </>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // 메인 이미지
  mainImage: { width: SCREEN_WIDTH, height: 280 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },

  // 기본 정보
  infoSection: { padding: 20, borderBottomWidth: 8 },
  header: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '700', flex: 1 },
  category: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  visitCountBadge: { fontSize: 14, fontWeight: '600' },
  actionButton: { alignItems: 'center' },
  actionCount: { fontSize: 12, marginTop: 2 },

  // 길찾기 링크
  naverMapLink: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12,
  },
  naverMapLinkText: { fontSize: 13 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },

  // 리뷰 섹션
  commentSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 16 },
  reviewGallery: { marginBottom: 20 },
  reviewGalleryScroll: { gap: 6 },
  reviewGalleryImage: { width: 100, height: 100, borderRadius: 8 },

  // 리뷰 이미지
  reviewImageRow: { marginBottom: 10 },
  reviewImage: { width: 140, height: 140, borderRadius: 10, marginRight: 8 },

  // 이미지 확대 뷰어
  viewerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  viewerClose: { position: 'absolute', top: 60, right: 20, zIndex: 10, padding: 8 },
  viewerImage: { width: SCREEN_WIDTH, height: Dimensions.get('window').height * 0.7 },

  // 리뷰 카드
  commentItem: { paddingVertical: 16, borderBottomWidth: 0.5 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentAuthor: { fontSize: 14, fontWeight: '600' },
  visitBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  visitBadgeText: { fontSize: 11, fontWeight: '500' },
  commentDate: { fontSize: 11 },
  commentContent: { fontSize: 14, lineHeight: 20 },
  noCommentsWrap: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  noComments: { textAlign: 'center', fontSize: 14 },

  // 하단 고정 바
  bottomBar: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 0.5,
  },
  bottomButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12,
  },
  bottomButtonPrimary: { flex: 1.5 },
  bottomButtonText: { fontSize: 14, fontWeight: '600' },

  // 스켈레톤
  skeletonInfo: { padding: 20, gap: 10 },
  skeletonTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skeletonNavRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  skeletonMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  skeletonComments: { padding: 20, gap: 16 },
  skeletonComment: { gap: 8 },
  skeletonCommentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
