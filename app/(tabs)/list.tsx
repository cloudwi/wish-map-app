import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { setItem, getItem } from '../../utils/secureStorage';
import { MapListTabHeader } from '../../components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { restaurantApi } from '../../api/restaurant';
import { placeCategoryApi } from '../../api/placeCategory';
import { RestaurantCard } from '../../components/RestaurantCard';
import RestaurantCardSkeleton from '../../components/RestaurantCardSkeleton';
import { useTheme } from '../../hooks/useTheme';
import { useGroupStore } from '../../stores/groupStore';
import { lightTap } from '../../utils/haptics';

const STORAGE_KEY_CATEGORY = 'list_selected_category';
const STORAGE_KEY_TAGS = 'list_selected_tags';

const KOREA_BOUNDS = { minLat: 33, maxLat: 38.5, minLng: 124, maxLng: 132 };
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

type SortBy = 'latest' | 'visits';

export default function ListScreen() {
  const c = useTheme();
  const queryClient = useQueryClient();
  const { selectedGroupId } = useGroupStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('latest');
  const [restoredFilter, setRestoredFilter] = useState(false);

  // 카테고리 목록
  const { data: placeCategoryList = [] } = useQuery({
    queryKey: ['placeCategories'],
    queryFn: placeCategoryApi.getPlaceCategories,
    staleTime: 1000 * 60 * 30, // 30분
  });

  const selectedCategoryData = useMemo(
    () => placeCategoryList.find(cat => cat.id === selectedCategoryId),
    [placeCategoryList, selectedCategoryId]
  );

  // 저장된 필터 복원
  useEffect(() => {
    if (placeCategoryList.length === 0) return;
    (async () => {
      try {
        const [savedCatId, savedTags] = await Promise.all([
          getItem(STORAGE_KEY_CATEGORY),
          getItem(STORAGE_KEY_TAGS),
        ]);
        if (savedCatId) {
          const catId = Number(savedCatId);
          if (placeCategoryList.some(cat => cat.id === catId)) {
            setSelectedCategoryId(catId);
          }
        }
        if (savedTags) {
          setSelectedTags(JSON.parse(savedTags));
        }
      } catch {}
      setRestoredFilter(true);
    })();
  }, [placeCategoryList]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 필터 변경 시 저장
  useEffect(() => {
    if (!restoredFilter) return;
    setItem(STORAGE_KEY_CATEGORY, selectedCategoryId !== null ? String(selectedCategoryId) : '');
  }, [selectedCategoryId, restoredFilter]);

  useEffect(() => {
    if (!restoredFilter) return;
    setItem(STORAGE_KEY_TAGS, JSON.stringify(selectedTags));
  }, [selectedTags, restoredFilter]);

  // 맛집 무한스크롤 쿼리
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: ['restaurants', selectedCategoryId, debouncedSearch, sortBy, selectedTags, selectedGroupId],
    queryFn: async ({ pageParam = 0 }) => {
      if (selectedGroupId) {
        return restaurantApi.getGroupRestaurants(selectedGroupId, KOREA_BOUNDS);
      }
      return restaurantApi.getRestaurantList({
        placeCategoryId: selectedCategoryId || undefined,
        search: debouncedSearch || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort: sortBy,
        page: pageParam,
        size: PAGE_SIZE,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      lastPage.last ? undefined : lastPageParam + 1,
    enabled: restoredFilter,
  });

  const restaurants = useMemo(
    () => data?.pages.flatMap(page => page.content) ?? [],
    [data]
  );

  const totalElements = data?.pages[0]?.totalElements ?? 0;

  const onRefresh = useCallback(() => {
    queryClient.resetQueries({ queryKey: ['restaurants', selectedCategoryId, debouncedSearch, sortBy, selectedTags, selectedGroupId] });
  }, [queryClient, selectedCategoryId, debouncedSearch, sortBy, selectedTags, selectedGroupId]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && restaurants.length === 0) {
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
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
          onPress={() => { lightTap(); setSelectedCategoryId(null); setSelectedTags([]); }}
        >
          <Text style={[styles.categoryText, { color: selectedCategoryId === null ? c.chipActiveText : c.chipText }, selectedCategoryId === null && { fontWeight: '600' }]}>전체</Text>
        </TouchableOpacity>
        {placeCategoryList.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryBtn, { backgroundColor: selectedCategoryId === cat.id ? c.chipActiveBg : c.chipBg }]}
            onPress={() => { lightTap(); setSelectedCategoryId(cat.id); setSelectedTags([]); }}
          >
            <Text style={[styles.categoryText, { color: selectedCategoryId === cat.id ? c.chipActiveText : c.chipText }, selectedCategoryId === cat.id && { fontWeight: '600' }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 서브 필터 (태그 - 다중 선택) */}
      {selectedCategoryData && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.subFilterContent}>
          {selectedCategoryData.tagGroups.flatMap(g => g.tags).map((t) => {
            const isActive = selectedTags.includes(t);
            return (
              <TouchableOpacity
                key={t}
                style={[styles.subFilterBtn, { backgroundColor: isActive ? c.chipActiveBg : c.chipBg }]}
                onPress={() => {
                  lightTap();
                  setSelectedTags(prev =>
                    prev.includes(t) ? prev.filter(tag => tag !== t) : [...prev, t]
                  );
                }}
              >
                <Text style={[styles.subFilterText, { color: isActive ? c.chipActiveText : c.chipText }, isActive && { fontWeight: '600' }]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
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
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={onRefresh} colors={[c.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color={c.textDisabled} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>장소를 찾을 수 없습니다</Text>
              <Text style={[styles.emptyDesc, { color: c.textDisabled }]}>다른 카테고리를 선택해보세요</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isFetchingNextPage ? (
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
    </TouchableWithoutFeedback>
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
