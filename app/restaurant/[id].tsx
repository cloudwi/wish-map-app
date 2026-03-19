import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, RefreshControl, Linking, Dimensions } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { RestaurantDetail, Comment } from '../../types';
import { TaggedContent } from '../../components/TaggedContent';
import { restaurantApi } from '../../api/restaurant';
import { commentApi } from '../../api/comment';
import { searchPlaceImages } from '../../api/search';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { showError, showInfo } from '../../utils/toast';
import { mediumTap, lightTap, successTap } from '../../utils/haptics';
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


  const fetchData = useCallback(async () => {
    try {
      const [restaurantData, commentsData] = await Promise.all([
        restaurantApi.getRestaurantDetail(Number(id)),
        commentApi.getComments(Number(id)),
      ]);
      setRestaurant(restaurantData);
      setComments(commentsData.content);
      if (!restaurantData.thumbnailImage && restaurantData.images.length === 0) {
        searchPlaceImages(restaurantData.name + ' 맛집', 3).then(setSearchImages);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
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
      showError('오류', '댓글 작성 중 오류가 발생했습니다.');
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

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.surface }]}>
        <Skeleton width="100%" height={250} borderRadius={0} />
        <View style={{ padding: 20, gap: 12 }}>
          <Skeleton width="70%" height={24} borderRadius={4} />
          <Skeleton width="90%" height={14} borderRadius={4} />
          <Skeleton width="50%" height={14} borderRadius={4} />
          <View style={{ height: 20 }} />
          <Skeleton width="100%" height={60} borderRadius={8} />
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
          }
        >
          {/* 이미지 */}
          {(() => {
            const allImages = restaurant.images.length > 0
              ? restaurant.images
              : restaurant.thumbnailImage
                ? [restaurant.thumbnailImage]
                : searchImages;
            return allImages.length > 0 ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {allImages.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={[styles.mainImage, { backgroundColor: c.imagePlaceholderBg }]} />
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.mainImage, styles.imagePlaceholder, { backgroundColor: c.imagePlaceholderBg }]}>
                <Ionicons name="restaurant-outline" size={48} color="#d4c4bc" />
              </View>
            );
          })()}

          {/* 기본 정보 */}
          <Animated.View entering={FadeIn.duration(400)} style={[styles.infoSection, { borderBottomColor: c.background }]}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{restaurant.name}</Text>
                {restaurant.category && (
                  <Text style={[styles.category, { backgroundColor: c.categoryBadgeBg, color: c.categoryBadgeText }]}>{restaurant.category}</Text>
                )}
              </View>
              <View style={styles.actions}>
                <Text style={[styles.visitCountBadge, { color: c.textSecondary }]}>👣 {restaurant.visitCount}회</Text>
              </View>
            </View>

            {/* 방문하기 (네이버 지도) */}
            <TouchableOpacity
              style={[styles.naverMapButton, { borderColor: c.border }]}
              onPress={handleOpenNaverMap}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={18} color="#1EC800" />
              <Text style={[styles.naverMapButtonText, { color: c.textPrimary }]}>방문하기</Text>
              <Ionicons name="open-outline" size={14} color={c.textTertiary} />
            </TouchableOpacity>

            {/* 방문 인증 */}
            <TouchableOpacity
              style={[
                styles.visitButton,
                restaurant.isVisited
                  ? { backgroundColor: c.categoryBadgeBg }
                  : { backgroundColor: '#FF6B35' },
              ]}
              onPress={handleVisit}
              disabled={restaurant.isVisited || visitLoading}
            >
              {visitLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : restaurant.isVisited ? (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={[styles.visitButtonText, { color: c.textSecondary }]}>
                    오늘 방문 완료 ✓
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="footsteps-outline" size={20} color="#fff" />
                  <Text style={[styles.visitButtonText, { color: '#fff' }]}>
                    방문 인증하기 (100m 이내)
                  </Text>
                </>
              )}
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
          </Animated.View>

          {/* 댓글 섹션 */}
          <View style={styles.commentSection}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
              댓글 {restaurant.commentCount}개
            </Text>

            {comments.map((comment, index) => (
              <Animated.View
                key={comment.id}
                entering={FadeIn.delay(index * 50).duration(300)}
                style={[styles.commentItem, { borderBottomColor: c.divider }]}
              >
                <View style={styles.commentHeader}>
                  <Text style={[styles.commentAuthor, { color: c.textPrimary }]}>{comment.user.nickname}</Text>
                  <Text style={[styles.commentDate, { color: c.textTertiary }]}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                    {comment.isEdited && ' (수정됨)'}
                  </Text>
                </View>
                {comment.isDeleted ? (
                  <Text style={[styles.commentContent, { color: c.textTertiary, fontStyle: 'italic' }]}>
                    {comment.content}
                  </Text>
                ) : (
                  <TaggedContent content={comment.content} />
                )}
              </Animated.View>
            ))}

            {comments.length === 0 && (
              <View style={styles.noCommentsWrap}>
                <Ionicons name="chatbubble-outline" size={32} color={c.textDisabled} />
                <Text style={[styles.noComments, { color: c.textSecondary }]}>
                  아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 댓글 입력 - 하단 고정 */}
        <View style={[styles.commentInputFixed, { backgroundColor: c.surface, borderTopColor: c.divider }]}>
          <TextInput
            style={[styles.commentInput, { borderColor: c.border, backgroundColor: c.inputBg, color: c.textPrimary }]}
            placeholder="댓글을 입력하세요"
            placeholderTextColor={c.textDisabled}
            value={newComment}
            onChangeText={setNewComment}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.submitButton, (!newComment.trim() || submitting) && { backgroundColor: c.primaryLight, opacity: 0.5 }]}
            onPress={handleSubmitComment}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={18} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  mainImage: { width: Dimensions.get('window').width, height: 250 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  infoSection: { padding: 20, borderBottomWidth: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 22, fontWeight: 'bold' },
  category: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, fontSize: 13,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  visitCountBadge: { fontSize: 14, fontWeight: '600' },
  actionButton: { alignItems: 'center' },
  actionCount: { fontSize: 12, marginTop: 2 },
  naverMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  naverMapButtonText: { fontSize: 15, fontWeight: '600' },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  visitButtonText: { fontSize: 15, fontWeight: '600' },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 13 },
  commentSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  commentItem: { paddingVertical: 14, borderBottomWidth: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commentAuthor: { fontSize: 14, fontWeight: '600' },
  commentDate: { fontSize: 12 },
  commentContent: { fontSize: 14, lineHeight: 20 },
  noCommentsWrap: { alignItems: 'center', paddingVertical: 30, gap: 8 },
  noComments: { textAlign: 'center' },
  commentInputFixed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
    borderTopWidth: 1,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
