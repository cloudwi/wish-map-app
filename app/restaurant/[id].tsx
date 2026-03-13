import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, TextInput, FlatList, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantDetail, Comment } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { commentApi } from '../../api/comment';
import { useAuthStore } from '../../stores/authStore';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  
  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
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
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '좋아요를 하려면 로그인이 필요합니다.');
      return;
    }
    
    try {
      const result = await restaurantApi.toggleLike(Number(id));
      setRestaurant(prev => prev ? {
        ...prev,
        isLiked: result.liked,
        likeCount: result.liked ? prev.likeCount + 1 : prev.likeCount - 1,
      } : null);
    } catch (error) {
      Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '북마크를 하려면 로그인이 필요합니다.');
      return;
    }
    
    try {
      const result = await restaurantApi.toggleBookmark(Number(id));
      setRestaurant(prev => prev ? {
        ...prev,
        isBookmarked: result.bookmarked,
      } : null);
    } catch (error) {
      Alert.alert('오류', '북마크 처리 중 오류가 발생했습니다.');
    }
  };

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '댓글을 작성하려면 로그인이 필요합니다.');
      return;
    }

    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const comment = await commentApi.createComment(Number(id), newComment);
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      setRestaurant(prev => prev ? {
        ...prev,
        commentCount: prev.commentCount + 1,
      } : null);
    } catch (error) {
      Alert.alert('오류', '댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.loadingContainer}>
        <Text>맛집 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: restaurant.name,
          headerStyle: { backgroundColor: '#FF6B35' },
          headerTintColor: '#fff',
        }}
      />
      
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={styles.scrollView}>
          {/* 이미지 */}
          <Image 
            source={{ uri: restaurant.thumbnailImage || restaurant.images[0] || 'https://via.placeholder.com/400x200' }}
            style={styles.mainImage}
          />

          {/* 기본 정보 */}
          <View style={styles.infoSection}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={styles.name}>{restaurant.name}</Text>
                {restaurant.category && (
                  <Text style={styles.category}>{restaurant.category}</Text>
                )}
              </View>
              <View style={styles.actions}>
                <TouchableOpacity onPress={handleLike} style={styles.actionButton}>
                  <Ionicons 
                    name={restaurant.isLiked ? "heart" : "heart-outline"} 
                    size={26} 
                    color={restaurant.isLiked ? "#FF6B35" : "#666"} 
                  />
                  <Text style={styles.actionCount}>{restaurant.likeCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleBookmark} style={styles.actionButton}>
                  <Ionicons 
                    name={restaurant.isBookmarked ? "bookmark" : "bookmark-outline"} 
                    size={24} 
                    color={restaurant.isBookmarked ? "#FF6B35" : "#666"} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color="#888" />
              <Text style={styles.address}>{restaurant.address}</Text>
            </View>

            {restaurant.description && (
              <Text style={styles.description}>{restaurant.description}</Text>
            )}

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                제안: {restaurant.suggestedBy.nickname}
              </Text>
              <Text style={styles.metaText}>
                {new Date(restaurant.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* 댓글 섹션 */}
          <View style={styles.commentSection}>
            <Text style={styles.sectionTitle}>
              댓글 {restaurant.commentCount}개
            </Text>

            {/* 댓글 입력 */}
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="댓글을 입력하세요"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity 
                style={styles.submitButton}
                onPress={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>

            {/* 댓글 목록 */}
            {comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>{comment.user.nickname}</Text>
                  <Text style={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                    {comment.isEdited && ' (수정됨)'}
                  </Text>
                </View>
                <Text style={[
                  styles.commentContent,
                  comment.isDeleted && styles.deletedComment
                ]}>
                  {comment.content}
                </Text>
              </View>
            ))}

            {comments.length === 0 && (
              <Text style={styles.noComments}>
                아직 댓글이 없습니다. 첫 댓글을 남겨보세요!
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  category: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 13,
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  address: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  description: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 13,
    color: '#999',
  },
  commentSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
  },
  commentContent: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  deletedComment: {
    color: '#999',
    fontStyle: 'italic',
  },
  noComments: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 30,
  },
});
