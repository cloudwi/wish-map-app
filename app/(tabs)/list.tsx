import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Restaurant } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { RestaurantCard } from '../../components/RestaurantCard';
import { LoadingScreen } from '../../components/LoadingScreen';

const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '카페', '술집', '기타'];

// 전체 한국 범위
const KOREA_BOUNDS = { minLat: 33, maxLat: 38.5, minLng: 124, maxLng: 132 };

export default function ListScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchRestaurants = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 0) setLoading(true);

      const response = await restaurantApi.getRestaurants(KOREA_BOUNDS, pageNum, 20);

      setRestaurants(prev => pageNum === 0 ? response.content : [...prev, ...response.content]);
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRestaurants(0); }, [fetchRestaurants]);

  const onRefresh = useCallback(() => fetchRestaurants(0, true), [fetchRestaurants]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) fetchRestaurants(page + 1);
  }, [hasMore, loading, page, fetchRestaurants]);

  const filteredRestaurants = selectedCategory === '전체'
    ? restaurants
    : restaurants.filter(r => r.category === selectedCategory);

  if (loading && restaurants.length === 0) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* 카테고리 필터 */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryBtn, selectedCategory === item && styles.categoryBtnActive]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 맛집 목록 */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <RestaurantCard item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>등록된 맛집이 없습니다</Text>
          </View>
        }
        ListFooterComponent={hasMore ? <ActivityIndicator style={styles.footer} color="#FF6B35" /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  categoryList: { backgroundColor: '#fff', maxHeight: 50 },
  categoryContent: { paddingHorizontal: 15, paddingVertical: 10, gap: 8 },
  categoryBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#f0f0f0', marginRight: 8,
  },
  categoryBtnActive: { backgroundColor: '#FF6B35' },
  categoryText: { fontSize: 14, color: '#666' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  listContent: { padding: 15 },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
  footer: { paddingVertical: 20 },
});
