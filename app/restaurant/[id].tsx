import { StyleSheet, View, Text, ScrollView, FlatList, TouchableOpacity, Platform, RefreshControl, Linking, Dimensions, Modal, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalSearchParams, Stack, router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantDetail, Comment, PlaceCategory } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { commentApi } from '../../api/comment';
import { searchPlaceImages } from '../../api/search';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { lightTap } from '../../utils/haptics';
import { TaggedContent } from '../../components/TaggedContent';
import Skeleton from '../../components/Skeleton';
import { CategoryPlaceholder } from '../../components/CategoryPlaceholder';
import { placeCategoryApi } from '../../api/placeCategory';

export default function RestaurantDetailScreen() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentPage, setCommentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchImages, setSearchImages] = useState<string[]>([]);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [placeCategories, setPlaceCategories] = useState<PlaceCategory[]>([]);

  const fetchRestaurant = useCallback(async () => {
    try {
      const data = await restaurantApi.getRestaurantDetail(Number(id));
      setRestaurant(data);
      if (!data.thumbnailImage && data.images.length === 0) {
        searchPlaceImages(data.name, 3).then(setSearchImages);
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    }
  }, [id]);

  const fetchComments = useCallback(async (page: number, reset = false) => {
    try {
      const data = await commentApi.getComments(Number(id), page, 20);
      setComments(prev => reset ? data.content : [...prev, ...data.content]);
      setHasMoreComments(!data.last);
      setCommentPage(page);
    } catch {}
  }, [id]);

  useEffect(() => {
    (async () => {
      await fetchRestaurant();
      await fetchComments(0, true);
      setLoading(false);
    })();
  }, [fetchRestaurant, fetchComments]);

  useEffect(() => { placeCategoryApi.getPlaceCategories().then(setPlaceCategories).catch(() => {}); }, []);

  // 화면 복귀 시 restaurant만 조용히 재조회 (깜박임 없이 isVisited 등 갱신)
  useFocusEffect(useCallback(() => {
    if (!loading) fetchRestaurant();
  }, [loading, fetchRestaurant]));

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await Promise.all([fetchRestaurant(), fetchComments(0, true)]);
    } catch {} finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchRestaurant, fetchComments]);

  const loadMoreComments = useCallback(async () => {
    if (!hasMoreComments || loadingMore) return;
    setLoadingMore(true);
    await fetchComments(commentPage + 1);
    setLoadingMore(false);
  }, [hasMoreComments, loadingMore, commentPage, fetchComments]);

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

  const handleVisit = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    lightTap();
    router.push({
      pathname: '/visit-review',
      params: {
        placeName: restaurant?.name || '',
        placeLat: String(restaurant?.lat || ''),
        placeLng: String(restaurant?.lng || ''),
        placeId: restaurant?.naverPlaceId || '',
        placeCategory: restaurant?.category || '',
        restaurantId: String(restaurant?.id || ''),
        placeCategoryId: restaurant?.placeCategoryId ? String(restaurant.placeCategoryId) : '',
      },
    });
  };

  const activeComments = comments.filter(r => !r.isDeleted && (r.content || r.tags?.length > 0 || r.images?.length > 0));

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface }]}>
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

  if (!restaurant) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.surface }]}>
        <Ionicons name="alert-circle-outline" size={48} color={c.textDisabled} />
        <Text style={{ color: c.textSecondary, marginTop: 12 }}>장소 정보를 찾을 수 없습니다.</Text>
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
          headerBackButtonDisplayMode: 'minimal',
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
                  <View style={[styles.mainImage, styles.imagePlaceholder]}>
                    <CategoryPlaceholder
                      icon={placeCategories.find(cat => cat.id === restaurant.placeCategoryId)?.icon}
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
                    <Text style={[styles.name, { color: c.textPrimary }]}>{restaurant.name}</Text>
                    {restaurant.category && (
                      <Text style={[styles.category, { backgroundColor: c.categoryBadgeBg, color: c.categoryBadgeText }]}>{restaurant.category}</Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <Text style={[styles.visitCountBadge, { color: c.textSecondary }]}>방문 {restaurant.visitCount}회</Text>
                  </View>
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

              {/* 방문 기록 타이틀 */}
              {activeComments.length > 0 && (
                <View style={[styles.visitLogSection, { borderTopColor: c.background }]}>
                  <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
                    방문 기록 {activeComments.length}개
                  </Text>
                </View>
              )}
            </>
          }
          renderItem={({ item }) => (
            <View style={[styles.visitLogItem, { borderBottomColor: c.divider, marginHorizontal: 20 }]}>
              <View style={styles.visitLogHeader}>
                <View style={styles.visitLogAuthorRow}>
                  <Text style={[styles.visitLogAuthor, { color: c.textPrimary }]}>{item.user.nickname}</Text>
                  {item.userVisitCount > 0 && (
                    <View style={[styles.visitBadge, { backgroundColor: c.chipBg }]}>
                      <Text style={[styles.visitBadgeText, { color: c.textTertiary }]}>
                        {item.userVisitCount}번 방문
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.visitLogDate, { color: c.textTertiary }]}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
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
              restaurant.isVisited
                ? { backgroundColor: c.chipBg }
                : { backgroundColor: c.primary },
            ]}
            onPress={handleVisit}
            disabled={restaurant.isVisited}
            activeOpacity={0.8}
          >
            {restaurant.isVisited ? (
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
  visitCountBadge: { fontSize: 14, fontWeight: '600' },

  naverMapLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  naverMapLinkText: { fontSize: 13 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },

  // 방문 기록
  visitLogSection: { paddingHorizontal: 20, paddingTop: 20, borderTopWidth: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  loadingMoreWrap: { paddingVertical: 20, alignItems: 'center' },
  visitLogItem: { paddingVertical: 16, borderBottomWidth: 0.5 },
  visitLogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  visitLogAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  visitLogAuthor: { fontSize: 14, fontWeight: '600' },
  visitBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  visitBadgeText: { fontSize: 11, fontWeight: '500' },
  visitLogDate: { fontSize: 11 },
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
