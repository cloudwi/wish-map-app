import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MapListTabHeader } from '../../components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant, PlaceCategory } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { placeCategoryApi } from '../../api/placeCategory';
import { RestaurantCard } from '../../components/RestaurantCard';
import RestaurantCardSkeleton from '../../components/RestaurantCardSkeleton';
import { useTheme } from '../../hooks/useTheme';
import { useGroupStore } from '../../stores/groupStore';
import { lightTap } from '../../utils/haptics';

const KOREA_BOUNDS = { minLat: 33, maxLat: 38.5, minLng: 124, maxLng: 132 };
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

type SortBy = 'latest' | 'visits';

export default function ListScreen() {
  const c = useTheme();
  const { selectedGroupId } = useGroupStore();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [placeCategoryList, setPlaceCategoryList] = useState<PlaceCategory[]>([]);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('latest');

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const fetchingRef = useRef(false);

  const selectedCategoryData = useMemo(
    () => placeCategoryList.find(cat => cat.id === selectedCategoryId),
    [placeCategoryList, selectedCategoryId]
  );

  useEffect(() => {
    placeCategoryApi.getPlaceCategories()
      .then(setPlaceCategoryList)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 데이터 요청 - 파라미터 직접 전달 (ref 사용 안 함)
  const fetchData = useCallback(async (params: {
    catId: number | null;
    search: string;
    sort: SortBy;
    tag: string | null;
    groupId: number | null;
    pageNum: number;
    isRefresh?: boolean;
  }) => {
    const { catId, search, sort, tag, groupId, pageNum, isRefresh } = params;

    if (pageNum > 0 && fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum > 0) setLoadingMore(true);

      let response;
      if (groupId) {
        response = await restaurantApi.getGroupRestaurants(groupId, KOREA_BOUNDS);
      } else {
        response = await restaurantApi.getRestaurantList({
          placeCategoryId: catId || undefined,
          search: search || undefined,
          tag: tag || undefined,
          sort,
          page: pageNum,
          size: PAGE_SIZE,
        });
      }

      setRestaurants(prev => pageNum === 0 ? response.content : [...prev, ...response.content]);
      setHasMore(!response.last);
      setTotalElements(response.totalElements);
      setPage(pageNum);
    } catch {
      if (pageNum > 0) setHasMore(false);
    } finally {
      fetchingRef.current = false;
      setInitialLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  // 필터 변경 시 페이지 0부터 다시 요청
  useEffect(() => {
    fetchData({
      catId: selectedCategoryId,
      search: debouncedSearch,
      sort: sortBy,
      tag: selectedTag,
      groupId: selectedGroupId,
      pageNum: 0,
    });
  }, [selectedCategoryId, debouncedSearch, sortBy, selectedTag, selectedGroupId, fetchData]);

  const onRefresh = useCallback(() => {
    fetchingRef.current = false;
    fetchData({
      catId: selectedCategoryId,
      search: debouncedSearch,
      sort: sortBy,
      tag: selectedTag,
      groupId: selectedGroupId,
      pageNum: 0,
      isRefresh: true,
    });
  }, [selectedCategoryId, debouncedSearch, sortBy, selectedTag, selectedGroupId, fetchData]);

  const loadMore = useCallback(() => {
    if (hasMore && !fetchingRef.current) {
      fetchData({
        catId: selectedCategoryId,
        search: debouncedSearch,
        sort: sortBy,
        tag: selectedTag,
        groupId: selectedGroupId,
        pageNum: page + 1,
      });
    }
  }, [hasMore, page, selectedCategoryId, debouncedSearch, sortBy, selectedTag, selectedGroupId, fetchData]);

  if (initialLoading && restaurants.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <MapListTabHeader />
        <View style={[styles.searchWrap, { backgroundColor: c.searchBg }]}>
          <Ionicons name="search-outline" size={18} color={c.textTertiary} style={styles.searchIcon} />
          <TextInput style={[styles.searchInput, { color: c.textPrimary }]} placeholder="장소 이름 검색" placeholderTextColor={c.textDisabled} editable={false} />
        </View>
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 6 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
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
          placeholder="장소 이름 검색"
          placeholderTextColor={c.textDisabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={c.textDisabled} />
          </TouchableOpacity>
        )}
      </View>

      {/* 카테고리 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.categoryContent}>
        <TouchableOpacity
          style={[styles.categoryBtn, { backgroundColor: selectedCategoryId === null ? c.chipActiveBg : c.chipBg }]}
          onPress={() => { lightTap(); setSelectedCategoryId(null); setSelectedTag(null); }}
        >
          <Text style={[styles.categoryText, { color: selectedCategoryId === null ? c.chipActiveText : c.chipText }, selectedCategoryId === null && { fontWeight: '600' }]}>전체</Text>
        </TouchableOpacity>
        {placeCategoryList.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryBtn, { backgroundColor: selectedCategoryId === cat.id ? c.chipActiveBg : c.chipBg }]}
            onPress={() => { lightTap(); setSelectedCategoryId(cat.id); setSelectedTag(null); }}
          >
            <Text style={[styles.categoryText, { color: selectedCategoryId === cat.id ? c.chipActiveText : c.chipText }, selectedCategoryId === cat.id && { fontWeight: '600' }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 서브 필터 (태그) */}
      {selectedCategoryData && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.subFilterContent}>
          {selectedCategoryData.tagGroups.flatMap(g => g.tags).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.subFilterBtn, { backgroundColor: selectedTag === t ? c.chipActiveBg : c.chipBg }]}
              onPress={() => { lightTap(); setSelectedTag(prev => prev === t ? null : t); }}
            >
              <Text style={[styles.subFilterText, { color: selectedTag === t ? c.chipActiveText : c.chipText }, selectedTag === t && { fontWeight: '600' }]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 정렬 */}
      <View style={styles.sortRow}>
        <Text style={[styles.resultCount, { color: c.textSecondary }]}>{totalElements}개</Text>
        <View style={styles.sortBtns}>
          {(['latest', 'visits'] as const).map((s) => (
            <TouchableOpacity key={s} style={[styles.sortBtn, sortBy === s && { backgroundColor: c.chipBg }]} onPress={() => { lightTap(); setSortBy(s); }}>
              <Text style={[styles.sortText, { color: sortBy === s ? c.textPrimary : c.textDisabled }, sortBy === s && { fontWeight: '600' }]}>
                {s === 'latest' ? '최신순' : '방문 많은 순'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 리스트 */}
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <RestaurantCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !initialLoading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={c.textDisabled} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>장소를 찾을 수 없습니다</Text>
              <Text style={[styles.emptyDesc, { color: c.textDisabled }]}>다른 카테고리를 선택해보세요</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasMore && loadingMore ? (
            <View style={styles.footerSkeleton}>
              {Array.from({ length: 2 }).map((_, i) => <RestaurantCardSkeleton key={`f-${i}`} />)}
            </View>
          ) : null
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skeletonWrap: { paddingTop: 16 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, marginBottom: 4, borderRadius: 8, paddingHorizontal: 14, height: 44 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  clearBtn: { padding: 8 },
  filterRow: { flexGrow: 0, flexShrink: 0 },
  categoryContent: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 6, alignItems: 'center' },
  categoryBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, marginRight: 6 },
  categoryText: { fontSize: 14 },
  subFilterContent: { paddingHorizontal: 14, paddingBottom: 8, gap: 6, alignItems: 'center' },
  subFilterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, marginRight: 6 },
  subFilterText: { fontSize: 13 },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 6 },
  resultCount: { fontSize: 13 },
  sortBtns: { flexDirection: 'row', gap: 4 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  sortText: { fontSize: 13 },
  listContent: { padding: 15, paddingTop: 4, paddingBottom: 100 },
  empty: { padding: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyDesc: { fontSize: 13 },
  footerSkeleton: { paddingBottom: 20 },
});
