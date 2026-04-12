import { StyleSheet, View, Text, FlatList, TouchableOpacity, RefreshControl, TextInput, ScrollView, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useInfiniteQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { setItem, getItem } from '../../utils/secureStorage';
import { MapListTabHeader } from '../../components/TabHeader';
import { Ionicons } from '@expo/vector-icons';
import { placeApi } from '../../api/place';
import { placeCategoryApi } from '../../api/placeCategory';
import { RestaurantCard } from '../../components/RestaurantCard';
import RestaurantCardSkeleton from '../../components/RestaurantCardSkeleton';
import { StatsSection } from '../../components/StatsSection';
import { useTheme } from '../../hooks/useTheme';
import { useGroupStore } from '../../stores/groupStore';
import { lightTap } from '../../utils/haptics';
import { KEYBOARD_DONE_ID } from '../../components/KeyboardDoneBar';
import type * as LocationType from 'expo-location';


const STORAGE_KEY_CATEGORY = 'list_selected_category';
const STORAGE_KEY_TAGS = 'list_selected_tags';

const KOREA_BOUNDS = { minLat: 33, maxLat: 38.5, minLng: 124, maxLng: 132 };
const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

export default function ListScreen() {
  const c = useTheme();
  const queryClient = useQueryClient();
  const { selectedGroupId } = useGroupStore();

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'visits' | 'recentVisit' | 'distance'>('visits');
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
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

  // 거리순 정렬 시 위치 가져오기
  useEffect(() => {
    if (sortBy !== 'distance') return;
    (async () => {
      try {
        const Location = require('expo-location') as typeof LocationType;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch {}
    })();
  }, [sortBy]);

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
    isFetching,
    isRefetching,
    isPlaceholderData,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['restaurants', selectedCategoryId, debouncedSearch, sortBy, selectedTags, selectedGroupId, sortBy === 'distance' ? userLocation : null],
    queryFn: async ({ pageParam = 0 }) => {
      if (selectedGroupId) {
        return placeApi.getGroupRestaurants(selectedGroupId, KOREA_BOUNDS);
      }
      return placeApi.getRestaurants({
        placeCategoryId: selectedCategoryId || undefined,
        search: debouncedSearch || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        sort: sortBy,
        page: pageParam,
        size: PAGE_SIZE,
        userLat: sortBy === 'distance' && userLocation ? userLocation.latitude : undefined,
        userLng: sortBy === 'distance' && userLocation ? userLocation.longitude : undefined,
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, _, lastPageParam) =>
      selectedGroupId ? undefined : (lastPage.last ? undefined : lastPageParam + 1),
    enabled: restoredFilter && (sortBy !== 'distance' || userLocation !== null),
    placeholderData: keepPreviousData,
  });

  const restaurants = useMemo(() => {
    const all = data?.pages.flatMap(page => page.content) ?? [];
    const seen = new Set<number>();
    return all.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [data]);

  const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLat = (lat2 - lat1) * 111000;
    const dLng = (lng2 - lng1) * 111000 * Math.cos(lat1 * Math.PI / 180);
    return Math.sqrt(dLat * dLat + dLng * dLng);
  };

  const displayRestaurants = restaurants;

  const totalElements = data?.pages[0]?.totalElements ?? 0;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

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
          <TextInput style={[styles.searchInput, { color: c.textPrimary }]} placeholder="장소 이름 검색" placeholderTextColor={c.textDisabled} editable={false} returnKeyType="search" />
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
          autoCapitalize="none"
          spellCheck={false}
          textContentType="none"
          inputAccessoryViewID={KEYBOARD_DONE_ID}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={c.textDisabled} />
          </TouchableOpacity>
        )}
      </View>

      <StatsSection />

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

      {/* 결과 수 + 정렬 */}
      <View style={styles.sortRow}>
        <Text style={[styles.resultCount, { color: c.textSecondary }]}>{totalElements}개</Text>
        <View style={styles.sortBtns}>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'visits' && { backgroundColor: c.chipActiveBg }]}
            onPress={() => { lightTap(); setSortBy('visits'); }}
          >
            <Text style={[styles.sortText, { color: sortBy === 'visits' ? c.chipActiveText : c.textTertiary }, sortBy === 'visits' && { fontWeight: '600' }]}>방문순</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'recentVisit' && { backgroundColor: c.chipActiveBg }]}
            onPress={() => { lightTap(); setSortBy('recentVisit'); }}
          >
            <Text style={[styles.sortText, { color: sortBy === 'recentVisit' ? c.chipActiveText : c.textTertiary }, sortBy === 'recentVisit' && { fontWeight: '600' }]}>최근 방문순</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortBtn, sortBy === 'distance' && { backgroundColor: c.chipActiveBg }]}
            onPress={() => { lightTap(); setSortBy('distance'); }}
          >
            <Text style={[styles.sortText, { color: sortBy === 'distance' ? c.chipActiveText : c.textTertiary }, sortBy === 'distance' && { fontWeight: '600' }]}>거리순</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 리스트 */}
      <FlatList
        data={displayRestaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => {
          const distanceBadge = sortBy === 'distance' && userLocation ? (() => {
            const dist = calcDistance(userLocation.latitude, userLocation.longitude, item.lat, item.lng);
            const label = dist < 1000 ? `${Math.round(dist)}m` : `${(dist / 1000).toFixed(1)}km`;
            return <Text style={{ fontSize: 11, color: c.textTertiary }}>{label}</Text>;
          })() : undefined;
          return <RestaurantCard item={item} index={index} placeCategories={placeCategoryList} badge={distanceBadge} />;
        }}
        contentContainerStyle={styles.listContent}
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={onRefresh} colors={[c.primary]} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading && !isFetching && !isPlaceholderData ? (
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
