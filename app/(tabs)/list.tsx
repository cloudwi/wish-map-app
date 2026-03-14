import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { RestaurantCard } from '../../components/RestaurantCard';
import RestaurantCardSkeleton from '../../components/RestaurantCardSkeleton';
import FloatingActionButton from '../../components/FloatingActionButton';
import { lightTap } from '../../utils/haptics';

const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '카페', '술집', '기타'];
const KOREA_BOUNDS = { minLat: 33, maxLat: 38.5, minLng: 124, maxLng: 132 };

type SortBy = 'latest' | 'likes';

export default function ListScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('latest');

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
    if (hasMore && !loading && !refreshing) fetchRestaurants(page + 1);
  }, [hasMore, loading, refreshing, page, fetchRestaurants]);

  const filteredRestaurants = useMemo(() => {
    let result = selectedCategory === '전체'
      ? restaurants
      : restaurants.filter(r => r.category === selectedCategory);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q),
      );
    }

    if (sortBy === 'likes') {
      result = [...result].sort((a, b) => b.likeCount - a.likeCount);
    }

    return result;
  }, [restaurants, selectedCategory, searchQuery, sortBy]);

  if (loading && restaurants.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 5 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 검색 */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="맛집 이름이나 주소 검색"
          placeholderTextColor="#bbb"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color="#ccc" />
          </TouchableOpacity>
        )}
      </View>

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
            onPress={() => { lightTap(); setSelectedCategory(item); }}
          >
            <Text style={[styles.categoryText, selectedCategory === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 정렬 */}
      <View style={styles.sortRow}>
        <Text style={styles.resultCount}>{filteredRestaurants.length}개</Text>
        <View style={styles.sortBtns}>
          {(['latest', 'likes'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]}
              onPress={() => { lightTap(); setSortBy(s); }}
            >
              <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
                {s === 'latest' ? '최신순' : '좋아요순'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FloatingActionButton />

      {/* 맛집 목록 */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <RestaurantCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color="#ddd" />
            <Text style={styles.emptyTitle}>맛집을 찾을 수 없습니다</Text>
            <Text style={styles.emptyDesc}>다른 검색어나 카테고리를 시도해보세요</Text>
          </View>
        }
        ListFooterComponent={hasMore ? <ActivityIndicator style={styles.footer} color="#FF6B35" /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  skeletonWrap: { paddingTop: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#333', paddingVertical: 0 },
  clearBtn: { padding: 8 },
  categoryList: { backgroundColor: 'transparent', maxHeight: 56 },
  categoryContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  categoryBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 18, backgroundColor: '#f0f0f0', marginRight: 6,
  },
  categoryBtnActive: { backgroundColor: '#333' },
  categoryText: { fontSize: 14, color: '#888' },
  categoryTextActive: { color: '#fff', fontWeight: '600' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  resultCount: { fontSize: 13, color: '#999' },
  sortBtns: { flexDirection: 'row', gap: 4 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  sortBtnActive: { backgroundColor: '#f0f0f0' },
  sortText: { fontSize: 13, color: '#bbb' },
  sortTextActive: { color: '#333', fontWeight: '600' },
  listContent: { padding: 15, paddingTop: 4 },
  empty: { padding: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#999' },
  emptyDesc: { fontSize: 13, color: '#bbb' },
  footer: { paddingVertical: 20 },
});
