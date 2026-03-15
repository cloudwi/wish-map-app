import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { RestaurantDetail, Comment } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { commentApi } from '../../api/comment';
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

  const fetchData = useCallback(async () => {
    try {
      const [restaurantData, commentsData] = await Promise.all([
        restaurantApi.getRestaurantDetail(Number(id)),
        commentApi.getComments(Number(id)),
      ]);
      setRestaurant(restaurantData);
      setComments(commentsData.content);
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

  const handleLike = async () => {
    if (!isAuthenticated) {
      showInfo('로그인 필요', '좋아요를 하려면 로그인이 필요합니다.');
      return;
    }
    try {
      mediumTap();
      const result = await restaurantApi.toggleLike(Number(id));
      setRestaurant(prev => prev ? {
        ...prev,
        isLiked: result.liked,
        likeCount: result.liked ? prev.likeCount + 1 : prev.likeCount - 1,
      } : null);
    } catch (error) {
      showError('오류', '좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      showInfo('로그인 필요', '북마크를 하려면 로그인이 필요합니다.');
      return;
    }
    try {
      lightTap();
      const result = await restaurantApi.toggleBookmark(Number(id));
      setRestaurant(prev => prev ? {
        ...prev,
        isBookmarked: result.bookmarked,
      } : null);
    } catch (error) {
      showError('오류', '북마크 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      showInfo('로그인 필요', '댓글을 작성하려면 로그인이 필요합니다.');
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
          {restaurant.thumbnailImage || restaurant.images[0] ? (
            <Image
              source={{ uri: restaurant.thumbnailImage || restaurant.images[0] }}
              style={[styles.mainImage, { backgroundColor: c.imagePlaceholderBg }]}
            />
          ) : (
            <View style={[styles.mainImage, styles.imagePlaceholder, { backgroundColor: c.imagePlaceholderBg }]}>
              <Ionicons name="restaurant-outline" size={48} color="#d4c4bc" />
            </View>
          )}

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
                <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                  <Ionicons
                    name={restaurant.isLiked ? 'heart' : 'heart-outline'}
                    size={26}
                    color={restaurant.isLiked ? c.primary : c.textSecondary}
                  />
                  <Text style={[styles.actionCount, { color: c.textSecondary }]}>{restaurant.likeCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBookmark} style={styles.actionButton}>
                  <Ionicons
                    name={restaurant.isBookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={24}
                    color={restaurant.isBookmarked ? c.primary : c.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color={c.textSecondary} />
              <Text style={[styles.address, { color: c.textSecondary }]}>{restaurant.address}</Text>
            </View>

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
                <Text style={[
                  styles.commentContent,
                  { color: c.textPrimary },
                  comment.isDeleted && { color: c.textTertiary, fontStyle: 'italic' },
                ]}>
                  {comment.content}
                </Text>
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
  mainImage: { width: '100%', height: 250 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  infoSection: { padding: 20, borderBottomWidth: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  titleRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 22, fontWeight: 'bold' },
  category: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, fontSize: 13,
  },
  actions: { flexDirection: 'row', gap: 12 },
  actionButton: { alignItems: 'center' },
  actionCount: { fontSize: 12, marginTop: 2 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  address: { fontSize: 14, flex: 1 },
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
