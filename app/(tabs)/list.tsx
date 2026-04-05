import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, ScrollView } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { MapListTabHeader } from '../../components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant, PriceRange, PRICE_RANGE_LABELS, PRICE_RANGES, PlaceCategory, DEFAULT_PLACE_CATEGORIES } from '../../types';
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

  // 데이터 상태
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [placeCategoryList, setPlaceCategoryList] = useState<PlaceCategory[]>([]);
  const [totalElements, setTotalElements] = useState(0);

  // 필터 상태
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('latest');

  // 로딩 상태 분리
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 페이지네이션 상태
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Refs: 동시 요청 방지 + 최신값 참조
  const fetchingRef = useRef(false);
  const hasDataRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filtersRef = useRef({ selectedCategoryId, debouncedSearch, sortBy, selectedPriceRange, selectedTag });
  filtersRef.current = { selectedCategoryId, debouncedSearch, sortBy, selectedPriceRange, selectedTag };

  // 카테고리 목록 로드
  useEffect(() => {
    placeCategoryApi.getPlaceCategories()
      .then(setPlaceCategoryList)
      .catch(() => setPlaceCategoryList(DEFAULT_PLACE_CATEGORIES));
  }, []);

  // 검색어 디바운스
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // 안정적인 fetch 함수 (ref로 최신 필터값 참조 → useCallback deps 불필요)
  const fetchRestaurants = useCallback(async (pageNum: number, isRefresh = false) => {
    // 페이지네이션 중복만 방지 (필터 변경은 허용)
    if (pageNum > 0 && fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (pageNum === 0 && !hasDataRef.current) {
        setInitialLoading(true);
      } else if (pageNum === 0) {
        setFilterLoading(true);
      } else if (pageNum > 0) {
        setLoadingMore(true);
      }

      const groupId = useGroupStore.getState().selectedGroupId;
      const { selectedCategoryId: catId, debouncedSearch: search, sortBy: sort, selectedPriceRange: pr, selectedTag: tag } = filtersRef.current;

      let response;
      if (groupId) {
        response = await restaurantApi.getGroupRestaurants(groupId, KOREA_BOUNDS);
      } else {
        response = await restaurantApi.getRestaurantList({
          placeCategoryId: catId || undefined,
          search: search || undefined,
          tag: tag || undefined,
          sort,
          priceRange: pr || undefined,
          page: pageNum,
          size: PAGE_SIZE,
        });
      }

      const newData = pageNum === 0 ? response.content : [...restaurants, ...response.content];
      setRestaurants(newData);
      hasDataRef.current = newData.length > 0;
      setHasMore(!response.last);
      setTotalElements(response.totalElements);
      setPage(pageNum);
    } catch {
      // 에러 시 추가 로드 중단
      if (pageNum > 0) setHasMore(false);
    } finally {
      fetchingRef.current = false;
      setInitialLoading(false);
      setFilterLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []); // deps 비움: filtersRef로 최신값 참조

  // 필터/검색/정렬/그룹 변경 시 첫 페이지부터 다시 로드
  useEffect(() => {
    fetchRestaurants(0);
  }, [selectedCategoryId, debouncedSearch, sortBy, selectedPriceRange, selectedTag, selectedGroupId, fetchRestaurants]);

  // Pull-to-refresh
  const onRefresh = useCallback(() => {
    fetchingRef.current = false; // refresh는 강제 허용
    fetchRestaurants(0, true);
  }, [fetchRestaurants]);

  // 무한 스크롤: 추가 로드
  const loadMore = useCallback(() => {
    if (hasMore && !fetchingRef.current) {
      fetchRestaurants(page + 1);
    }
  }, [hasMore, page, fetchRestaurants]);

  // 선택된 카테고리 데이터
  const selectedCategoryData = placeCategoryList.find(c => c.id === selectedCategoryId);

  // 카테고리 선택 핸들러
  const handleCategoryChange = useCallback((id: number | null) => {
    lightTap();
    setSelectedCategoryId(id);
    setSelectedPriceRange(null);
    setSelectedTag(null);
    setSearchQuery('');
    setDebouncedSearch('');
  }, []);

  // 정렬 변경 핸들러
  const handleSortChange = useCallback((sort: SortBy) => {
    lightTap();
    setSortBy(sort);
  }, []);

  // 하단 로딩 컴포넌트 (스켈레톤)
  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    if (loadingMore) {
      return (
        <View style={styles.footerSkeleton}>
          {Array.from({ length: 2 }).map((_, i) => (
            <RestaurantCardSkeleton key={`footer-skeleton-${i}`} />
          ))}
        </View>
      );
    }
    return null;
  }, [hasMore, loadingMore]);

  // 빈 상태 컴포넌트
  const [filterLoading, setFilterLoading] = useState(false);
  const renderEmpty = useCallback(() => {
    if (initialLoading || filterLoading) return null;
    return (
      <View style={styles.empty}>
        <Ionicons name="search-outline" size={48} color={c.textDisabled} />
        <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>장소를 찾을 수 없습니다</Text>
        <Text style={[styles.emptyDesc, { color: c.textDisabled }]}>
          {debouncedSearch ? '다른 검색어를 시도해보세요' : '다른 카테고리를 선택해보세요'}
        </Text>
      </View>
    );
  }, [initialLoading, filterLoading, debouncedSearch, c]);

  // 초기 로딩 (스켈레톤 풀 스크린)
  if (initialLoading && restaurants.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <MapListTabHeader />
        <View style={[styles.searchWrap, { backgroundColor: c.searchBg }]}>
          <Ionicons name="search-outline" size={18} color={c.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: c.textPrimary }]}
            placeholder="장소 이름 검색"
            placeholderTextColor={c.textDisabled}
            editable={false}
          />
        </View>
        <View style={styles.skeletonWrap}>
          {Array.from({ length: 6 }).map((_, i) => (
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
        {searchQuery.trim() !== debouncedSearch && searchQuery.length > 0 && (
          <ActivityIndicator size="small" color={c.textDisabled} style={styles.searchSpinner} />
        )}
      </View>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
      >
        <TouchableOpacity
          style={[
            styles.categoryBtn,
            { backgroundColor: c.chipBg },
            selectedCategoryId === null && { backgroundColor: c.chipActiveBg },
          ]}
          onPress={() => handleCategoryChange(null)}
        >
          <Text
            style={[
              styles.categoryText,
              { color: c.chipText },
              selectedCategoryId === null && { color: c.chipActiveText, fontWeight: '600' },
            ]}
          >
            전체
          </Text>
        </TouchableOpacity>
        {placeCategoryList.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryBtn,
              { backgroundColor: c.chipBg },
              selectedCategoryId === cat.id && { backgroundColor: c.chipActiveBg },
            ]}
            onPress={() => handleCategoryChange(cat.id)}
          >
            <Text
              style={[
                styles.categoryText,
                { color: c.chipText },
                selectedCategoryId === cat.id && { color: c.chipActiveText, fontWeight: '600' },
              ]}
            >
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 카테고리별 서브 필터 (가격대 + 태그) */}
      {selectedCategoryData && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.subFilterList}
          contentContainerStyle={styles.subFilterContent}
        >
          {selectedCategoryData.hasPriceRange && PRICE_RANGES.map((pr) => (
            <TouchableOpacity
              key={pr}
              style={[
                styles.subFilterBtn,
                { backgroundColor: c.chipBg },
                selectedPriceRange === pr && { backgroundColor: c.primaryBg },
              ]}
              onPress={() => {
                lightTap();
                setSelectedPriceRange(prev => prev === pr ? null : pr);
              }}
            >
              <Text
                style={[
                  styles.subFilterText,
                  { color: c.chipText },
                  selectedPriceRange === pr && { color: c.primary, fontWeight: '600' },
                ]}
              >
                {PRICE_RANGE_LABELS[pr]}
              </Text>
            </TouchableOpacity>
          ))}
          {selectedCategoryData.tagGroups.flatMap(g => g.tags).map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.subFilterBtn,
                { backgroundColor: c.chipBg },
                selectedTag === t && { backgroundColor: c.chipActiveBg },
              ]}
              onPress={() => {
                lightTap();
                setSelectedTag(prev => prev === t ? null : t);
              }}
            >
              <Text style={[
                styles.subFilterText,
                { color: c.chipText },
                selectedTag === t && { color: c.chipActiveText, fontWeight: '600' },
              ]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 정렬 + 총 개수 */}
      <View style={styles.sortRow}>
        <Text style={[styles.resultCount, { color: c.textSecondary }]}>
          {totalElements > 0 ? `전체 ${totalElements}개` : '0개'}
        </Text>
        <View style={styles.sortBtns}>
          {(['latest', 'visits'] as const).map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sortBtn, sortBy === s && { backgroundColor: c.chipBg }]}
              onPress={() => handleSortChange(s)}
            >
              <Text
                style={[
                  styles.sortText,
                  { color: c.textDisabled },
                  sortBy === s && { color: c.textPrimary, fontWeight: '600' },
                ]}
              >
                {s === 'latest' ? '최신순' : '방문 많은 순'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 맛집 목록 (무한 스크롤) */}
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => <RestaurantCard item={item} index={index} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  clearBtn: { padding: 8 },
  searchSpinner: { marginLeft: 4 },
  categoryList: { backgroundColor: 'transparent', flexGrow: 0, flexShrink: 0 },
  categoryContent: { paddingHorizontal: 14, paddingVertical: 10, gap: 6, alignItems: 'center' },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    marginRight: 6,
  },
  categoryText: { fontSize: 14 },
  subFilterList: { backgroundColor: 'transparent', flexGrow: 0, flexShrink: 0 },
  subFilterContent: { paddingHorizontal: 14, paddingBottom: 6, gap: 6, alignItems: 'center' },
  subFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 6,
  },
  subFilterText: { fontSize: 13 },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
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
