import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapListTabHeader } from '../../components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { categoryApi, Category } from '../../api/category';
import { RestaurantCard } from '../../components/RestaurantCard';
import RestaurantCardSkeleton from '../../components/RestaurantCardSkeleton';
import { useTheme } from '../../hooks/useTheme';
import { lightTap } from '../../utils/haptics';
const KOREA_BOUNDS = { minLat: 33, maxLat: 38.5, minLng: 124, maxLng: 132 };

type SortBy = 'latest' | 'visits';

export default function ListScreen() {
  const c = useTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [categories, setCategories] = useState<string[]>(['전체']);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('latest');

  useEffect(() => {
    categoryApi.getCategories()
      .then((data) => setCategories(['전체', ...data.map((c) => c.name)]))
      .catch(() => {});
  }, []);

  const fetchRestaurants = useCallback(async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 0) setLoading(true);

      const response = await restaurantApi.getRestaurants(KOREA_BOUNDS, pageNum, 20);
      setRestaurants(prev => pageNum === 0 ? response.content : [...prev, ...response.content]);
      setHasMore(!response.last);
      setPage(pageNum);
    } catch {
      // silently fail – list will show empty state
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
        r.name.toLowerCase().includes(q) || (r.category && r.category.toLowerCase().includes(q)),
      );
    }

    if (sortBy === 'visits') {
      result = [...result].sort((a, b) => b.visitCount - a.visitCount);
    }

    return result;
  }, [restaurants, selectedCategory, searchQuery, sortBy]);

  if (loading && restaurants.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 5 }).map((_, i) => (
            <RestaurantCardSkeleton key={i} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <MapListTabHeader />
      {/* 검색 */}
      <View style={[styles.searchWrap, { backgroundColor: c.searchBg }]}>
        <Ionicons name="search-outline" size={18} color={c.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: c.textPrimary }]}
          placeholder="맛집 이름이나 주소 검색"
          placeholderTextColor={c.textDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={c.textDisabled} />
          </TouchableOpacity>
        )}
      </View>

      {/* 카테고리 필터 */}
      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryBtn, { backgroundColor: c.chipBg }, selectedCategory === item && { backgroundColor: c.chipActiveBg }]}
            onPress={() => { lightTap(); setSelectedCategory(item); }}
          >
            <Text style={[styles.categoryText, { color: c.chipText }, selectedCategory === item && { color: c.chipActiveText, fontWeight: '600' }]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 정렬 */}
      <View style={styles.sortRow}>
        <Text style={[styles.resultCount, { color: c.textSecondary }]}>{filteredRestaurants.length}개</Text>
        <View style={styles.sortBtns}>
          {(['latest', 'visits'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortBtn, sortBy === s && { backgroundColor: c.chipBg }]}
              onPress={() => { lightTap(); setSortBy(s); }}
            >
              <Text style={[styles.sortText, { color: c.textDisabled }, sortBy === s && { color: c.textPrimary, fontWeight: '600' }]}>
                {s === 'latest' ? '최신순' : '방문순'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 맛집 목록 */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <RestaurantCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="search-outline" size={48} color={c.textDisabled} />
            <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>맛집을 찾을 수 없습니다</Text>
            <Text style={[styles.emptyDesc, { color: c.textDisabled }]}>다른 검색어나 카테고리를 시도해보세요</Text>
          </View>
        }
        ListFooterComponent={hasMore ? <ActivityIndicator style={styles.footer} color={c.primary} /> : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skeletonWrap: { paddingTop: 16 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  clearBtn: { padding: 8 },
  categoryList: { backgroundColor: 'transparent', maxHeight: 56 },
  categoryContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  categoryBtn: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 18, marginRight: 6,
  },
  categoryText: { fontSize: 14 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  resultCount: { fontSize: 13 },
  sortBtns: { flexDirection: 'row', gap: 4 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  sortText: { fontSize: 13 },
  listContent: { padding: 15, paddingTop: 4, paddingBottom: 100 },
  empty: { padding: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyDesc: { fontSize: 13 },
  footer: { paddingVertical: 20 },
});
