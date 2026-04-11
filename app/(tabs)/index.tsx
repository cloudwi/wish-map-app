import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Keyboard, Linking, Dimensions } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetFlatList, BottomSheetView } from '@gorhom/bottom-sheet';
import type * as LocationType from 'expo-location';
import { type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { Restaurant, MapBounds, PlaceCategory } from '../../types';
import { placeApi } from '../../api/place';
import { placeCategoryApi } from '../../api/placeCategory';
import { PlaceResult } from '../../api/search';
import NaverMap from '../../components/NaverMap';
import { RestaurantCard } from '../../components/RestaurantCard';
import { PlaceDetailSheet } from '../../components/PlaceDetailSheet';
import { SearchBar } from '../../components/map/SearchBar';
import { GroupChip } from '../../components/map/GroupChip';
import { MapControls } from '../../components/map/MapControls';
import { useSearch } from '../../hooks/useSearch';
import { useTheme } from '../../hooks/useTheme';
import { useGroupStore } from '../../stores/groupStore';
import { useAuthStore } from '../../stores/authStore';
import { lightTap, mediumTap } from '../../utils/haptics';
import { showError } from '../../utils/toast';
import { router, useFocusEffect } from 'expo-router';
import { RecommendSlot } from '../../components/RecommendSlot';

const INITIAL_BOUNDS: MapBounds = { minLat: 37.4, maxLat: 37.7, minLng: 126.8, maxLng: 127.2 };

export default function MapScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [showResearchBtn, setShowResearchBtn] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const initialLoadDone = useRef(false);

  const { searchQuery, searchResults, searching, handleSearch, searchNow, clearSearch } = useSearch();
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { groups, selectedGroupId, fetchGroups } = useGroupStore();
  const [placeCategories, setPlaceCategories] = useState<PlaceCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);
  const PAGE_SIZE = 20;
  const [listPage, setListPage] = useState(1);
  const sortedRestaurants = useMemo(() => {
    if (!userLocation) return restaurants;
    return [...restaurants].sort((a, b) => {
      const dA = Math.sqrt(((a.lat - userLocation.latitude) * 111000) ** 2 + ((a.lng - userLocation.longitude) * 111000 * Math.cos(userLocation.latitude * Math.PI / 180)) ** 2);
      const dB = Math.sqrt(((b.lat - userLocation.latitude) * 111000) ** 2 + ((b.lng - userLocation.longitude) * 111000 * Math.cos(userLocation.latitude * Math.PI / 180)) ** 2);
      return dA - dB;
    });
  }, [restaurants, userLocation]);
  const visibleRestaurants = useMemo(() => sortedRestaurants.slice(0, listPage * PAGE_SIZE), [sortedRestaurants, listPage]);
  const handleLoadMore = useCallback(() => {
    if (visibleRestaurants.length < restaurants.length) {
      setListPage(p => p + 1);
    }
  }, [visibleRestaurants.length, restaurants.length]);

  const [slotVisible, setSlotVisible] = useState(false);
  const [slotCandidates, setSlotCandidates] = useState<Restaurant[]>([]);
  const [slotWinner, setSlotWinner] = useState<Restaurant | null>(null);

  // 화면 포커스 시 stats 재조회 트리거 (방문 인증 후 돌아올 때)
  useFocusEffect(useCallback(() => {
    setStatsRefreshKey(k => k + 1);
  }, []));

  const bottomSheetRef = useRef<BottomSheet>(null);
  const detailSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<NaverMapViewRef>(null);
  const currentBoundsRef = useRef<MapBounds>(INITIAL_BOUNDS);
  const currentCameraRef = useRef<{ latitude: number; longitude: number; zoom: number }>({ latitude: 37.5665, longitude: 126.9780, zoom: 14 });
  const screenHeight = Dimensions.get('window').height;
  // 최대 높이: 검색바 + 그룹칩 아래까지만 (상태바 + 검색바 48 + 간격 8 + 그룹칩 36 + 여유 8)
  const maxSheetHeight = screenHeight - (insets.top + 48 + 8 + 36 + 8);
  const snapPoints = useMemo(() => [240, maxSheetHeight], [maxSheetHeight]);

  useEffect(() => {
    if (isAuthenticated) fetchGroups();
  }, [isAuthenticated]);

  useEffect(() => {
    placeCategoryApi.getPlaceCategories()
      .then(setPlaceCategories)
      .catch(() => {});
  }, []);

  // 그룹 선택/해제 시 자동으로 맛집 다시 로드 + 카메라 이동
  const pendingGroupFetchRef = useRef(false);

  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group?.baseLat && group?.baseLng) {
        const radius = group.baseRadius || 1000;
        const zoom = radius <= 300 ? 17 : radius <= 500 ? 16 : 15;
        pendingGroupFetchRef.current = true;
        mapRef.current?.animateCameraTo({
          latitude: group.baseLat, longitude: group.baseLng, zoom,
        });
        // 카메라 이동 완료 후 fetch할 수 있도록 딜레이
        setTimeout(() => {
          if (pendingGroupFetchRef.current && currentBoundsRef.current) {
            fetchRestaurants(currentBoundsRef.current);
            pendingGroupFetchRef.current = false;
          }
        }, 800);
        return;
      }
    }
    if (currentBoundsRef.current) {
      fetchRestaurants(currentBoundsRef.current);
    }
  }, [selectedGroupId]);

  const fetchRestaurants = useCallback(async (bounds: MapBounds, placeCategoryId?: number | null) => {
    try {
      const { selectedGroupId: groupId, groups: storeGroups } = useGroupStore.getState();
      const effectiveCategoryId = placeCategoryId !== undefined ? placeCategoryId : categoryFilter;

      // 그룹 선택 + 반경 설정 시 → 반경 기반 bounds로 제한
      let effectiveBounds = bounds;
      if (groupId) {
        const group = storeGroups.find(g => g.id === groupId);
        if (group?.baseLat && group?.baseLng && group?.baseRadius) {
          const radiusDeg = group.baseRadius / 111000;
          effectiveBounds = {
            minLat: group.baseLat - radiusDeg,
            maxLat: group.baseLat + radiusDeg,
            minLng: group.baseLng - radiusDeg / Math.cos(group.baseLat * Math.PI / 180),
            maxLng: group.baseLng + radiusDeg / Math.cos(group.baseLat * Math.PI / 180),
          };
        }
      }

      const response = groupId
        ? await placeApi.getGroupRestaurants(groupId, effectiveBounds)
        : await placeApi.getRestaurants({ bounds, placeCategoryId: effectiveCategoryId || undefined, size: 500 });
      setRestaurants(response.content);
      setListPage(1);
      setShowResearchBtn(false);
    } catch {
      // silently fail – map will show empty state
    } finally {
      setLoading(false);
      setTimeout(() => { initialLoadDone.current = true; }, 500);
    }
  }, [categoryFilter]);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    (async () => {
      try {
        const Location = require('expo-location') as typeof LocationType;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let location = await Location.getLastKnownPositionAsync();
          if (!location) {
            location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          }
          const { latitude, longitude } = location.coords;
          setUserLocation({ latitude, longitude });
          mapRef.current?.animateCameraTo({ latitude, longitude, zoom: 15 });
          const bounds: MapBounds = {
            minLat: latitude - 0.01,
            maxLat: latitude + 0.01,
            minLng: longitude - 0.01,
            maxLng: longitude + 0.01,
          };
          fetchRestaurants(bounds);
          // 위치 지속 업데이트
          subscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
            (loc) => setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }),
          );
          return;
        }
      } catch (e) {
        console.warn('[Location Error]', e);
      }
      fetchRestaurants(INITIAL_BOUNDS);
    })();
    return () => { subscription?.remove(); };
  }, [fetchRestaurants]);

  const handleBoundsChange = useCallback((bounds: MapBounds, camera: { latitude: number; longitude: number; zoom: number }) => {
    currentBoundsRef.current = bounds;
    currentCameraRef.current = camera;
    if (initialLoadDone.current) setShowResearchBtn(true);
  }, []);

  const handleResearch = useCallback(() => {
    mediumTap();
    fetchRestaurants(currentBoundsRef.current);
  }, [fetchRestaurants]);

  const handleSelectPlace = (place: PlaceResult) => {
    lightTap();
    clearSearch();
    setSelected(null);

    setSelectedPlace(place);
    Keyboard.dismiss();

    mapRef.current?.animateCameraTo({
      latitude: place.lat,
      longitude: place.lng,
      zoom: 16,
    });
    bottomSheetRef.current?.snapToIndex(0);
    setTimeout(() => detailSheetRef.current?.expand(), 100);
  };

  const closePlaceDetail = () => {
    detailSheetRef.current?.close();
    setSelectedPlace(null);
    setSelected(null);

    bottomSheetRef.current?.snapToIndex(0);
  };

  const openNaverMap = async (place: PlaceResult) => {
    lightTap();
    const appUrl = `nmap://place?lat=${place.lat}&lng=${place.lng}&name=${encodeURIComponent(place.name)}&appname=com.wishmap.app`;
    const placeIdMatch = place.link?.match(/bizes\/(\d+)/);
    const webUrl = placeIdMatch
      ? `https://m.place.naver.com/place/${placeIdMatch[1]}/home`
      : `https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const callPhone = (phone: string) => {
    lightTap();
    Linking.openURL(`tel:${phone}`);
  };

  const handleMarkerClick = useCallback(async (restaurant: Restaurant) => {
    lightTap();
    setSelected(restaurant);
    // Restaurant를 PlaceResult로 변환하여 동일한 바텀시트 표시
    const place: PlaceResult = {
      id: restaurant.naverPlaceId || '',
      name: restaurant.name,
      address: '',
      roadAddress: '',
      lat: restaurant.lat,
      lng: restaurant.lng,
      category: restaurant.category || '',
      phone: '',
      link: '',
    };
    // 네이버 검색으로 주소/전화번호 보강
    try {
      const { searchPlaces } = require('../../api/search');
      const results = await searchPlaces(restaurant.name);
      // 좌표가 가장 가까운 결과 매칭
      const match = results.length > 0
        ? results.reduce((closest: PlaceResult, r: PlaceResult) => {
            const distR = Math.abs(r.lat - restaurant.lat) + Math.abs(r.lng - restaurant.lng);
            const distC = Math.abs(closest.lat - restaurant.lat) + Math.abs(closest.lng - restaurant.lng);
            return distR < distC ? r : closest;
          })
        : null;
      if (match) {
        place.address = match.address;
        place.roadAddress = match.roadAddress;
        place.phone = match.phone;
        place.link = match.link;
        if (!place.id && match.id) place.id = match.id;
      }
    } catch {}
    setSelectedPlace(place);
  }, []);

  const handleRegisterCustomPlace = useCallback((categoryId: number, categoryName: string) => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (!userLocation) {
      showError('위치 필요', '현재 위치를 확인할 수 없습니다.');
      return;
    }
    clearSearch();
    Keyboard.dismiss();
    router.push({
      pathname: '/visit-review',
      params: {
        placeName: categoryName,
        placeLat: String(userLocation.latitude),
        placeLng: String(userLocation.longitude),
        placeId: '',
        placeCategory: '',
        restaurantId: '',
        placeCategoryId: String(categoryId),
      },
    });
  }, [isAuthenticated, userLocation, clearSearch]);

  const handleRecommend = useCallback(() => {
    mediumTap();
    clearSearch();
    Keyboard.dismiss();
    if (!userLocation) {
      showError('위치 필요', '현재 위치를 확인할 수 없습니다.');
      return;
    }
    // 300m 이내 음식점만 필터
    const nearby = restaurants.filter((r) => {
      if (r.placeCategoryId !== 1) return false; // 음식점만
      const dLat = (r.lat - userLocation.latitude) * 111000;
      const dLng = (r.lng - userLocation.longitude) * 111000 * Math.cos(userLocation.latitude * Math.PI / 180);
      return Math.sqrt(dLat * dLat + dLng * dLng) <= 300;
    });
    if (nearby.length === 0) {
      showError('추천 불가', '300m 이내에 등록된 음식점이 없습니다.');
      return;
    }
    const pick = nearby[Math.floor(Math.random() * nearby.length)];
    setSlotCandidates(nearby);
    setSlotWinner(pick);
    setSlotVisible(true);
  }, [restaurants, userLocation, clearSearch]);

  const handleSlotResult = useCallback((restaurant: Restaurant) => {
    setSlotVisible(false);
    handleMarkerClick(restaurant);
    mapRef.current?.animateCameraTo({ latitude: restaurant.lat, longitude: restaurant.lng, zoom: 16 });
  }, [handleMarkerClick]);

  const renderListItem = useCallback(({ item, index }: { item: Restaurant; index: number }) => (
    <RestaurantCard item={item} index={index} placeCategories={placeCategories} />
  ), [placeCategories]);

  return (
    <View style={styles.container}>
      {/* 지도 화면에서는 항상 밝은 상태바 (그라데이션 오버레이와 함께) */}
      <StatusBar style="light" />
      <NaverMap
        ref={mapRef}
        restaurants={restaurants}
        placeCategories={placeCategories}
        onMarkerClick={handleMarkerClick}
        onBoundsChange={handleBoundsChange}
        onTapMap={() => Keyboard.dismiss()}
        userLocation={userLocation}
        selectedPlace={selectedPlace}
        selectedId={selected?.id ?? null}
        selectedCategoryId={selected?.placeCategoryId ?? null}
      />

      {/* 상태바 영역 반투명 오버레이 (배터리/시간/와이파이 가독성 향상) */}
      <View
        style={[styles.statusBarOverlay, { height: insets.top }]}
        pointerEvents="none"
      />

      {/* 검색바 + 카테고리 필터 */}
      <SearchBar
        top={insets.top + 8}
        searchQuery={searchQuery}
        searchResults={searchResults}
        searching={searching}
        onSearch={handleSearch}
        onSearchNow={() => { searchNow(); setSearchFocused(true); }}
        onClearSearch={clearSearch}
        onSelectPlace={handleSelectPlace}
        placeCategories={placeCategories}
        selectedCategoryId={categoryFilter}
        onCategoryChange={(catId) => {
          setCategoryFilter(catId);
          if (currentBoundsRef.current) {
            fetchRestaurants(currentBoundsRef.current, catId);
          }
        }}
        onRegisterCustomPlace={handleRegisterCustomPlace}
      />

      {/* 그룹 선택 칩 */}
      <GroupChip top={insets.top + 60} />

      {showResearchBtn && (
        <View style={[styles.researchContainer, { top: insets.top + (isAuthenticated ? 100 : 60) }]}>
          <TouchableOpacity
            style={[styles.researchBtn, { backgroundColor: c.primary }]}
            onPress={handleResearch}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.researchText}>현재 지도에서 재검색</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 오른쪽 버튼: 줌 + 내 위치 + 추천 */}
      <MapControls
        mapRef={mapRef}
        currentCameraRef={currentCameraRef}
        onLocationUpdate={setUserLocation}
        onRecommend={handleRecommend}
      />

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: c.loadingOverlay }]}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={[styles.sheetBg, { backgroundColor: c.sheetBg }]}
        handleIndicatorStyle={{ backgroundColor: c.textDisabled, width: 40 }}
        enablePanDownToClose={false}
        enableOverDrag={false}
        topInset={insets.top + 100}
        containerStyle={{ zIndex: 10 }}
      >
        <View style={styles.listWrap}>
          <View style={styles.listHeader}>
            <Ionicons name="location" size={18} color={c.textSecondary} />
            <Text style={[styles.listTitle, { color: c.textPrimary }]}>주변 장소 {restaurants.length}개</Text>
          </View>
          <BottomSheetFlatList
            data={visibleRestaurants}
            keyExtractor={(item: Restaurant) => item.id.toString()}
            renderItem={renderListItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                {loading ? '장소를 불러오는 중...' : '이 지역에 등록된 장소가 없습니다'}
              </Text>
            }
            ListFooterComponent={
              visibleRestaurants.length < restaurants.length ? (
                <ActivityIndicator size="small" color={c.textDisabled} style={{ paddingVertical: 16 }} />
              ) : null
            }
          />
        </View>
      </BottomSheet>

      {selectedPlace && (
        <BottomSheet
          ref={detailSheetRef}
          enableDynamicSizing
          enablePanDownToClose
          onClose={() => { setSelectedPlace(null); bottomSheetRef.current?.snapToIndex(0); }}
          backgroundStyle={[styles.sheetBg, { backgroundColor: c.sheetBg }]}
          handleIndicatorStyle={{ backgroundColor: c.textDisabled, width: 40 }}
          containerStyle={{ zIndex: 20 }}
        >
          <BottomSheetView>
            <PlaceDetailSheet
              place={selectedPlace}
              onClose={closePlaceDetail}
              onOpenNaverMap={openNaverMap}
              onCallPhone={callPhone}
              onVisitSuccess={() => fetchRestaurants(currentBoundsRef.current)}
              weeklyChampion={selected?.weeklyChampion}
              placeCategories={placeCategories}
              refreshKey={statsRefreshKey}
            />
          </BottomSheetView>
        </BottomSheet>
      )}

      <RecommendSlot
        visible={slotVisible}
        candidates={slotCandidates}
        winner={slotWinner}
        onResult={handleSlotResult}
        onClose={() => setSlotVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  statusBarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  researchContainer: {
    position: 'absolute',
    top: 62,
    alignSelf: 'center',
    zIndex: 9,
  },
  researchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  researchText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetBg: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 6,
  },
  listWrap: { flex: 1 },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  listTitle: { fontSize: 15, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  emptyText: { textAlign: 'center', paddingVertical: 30, fontSize: 14 },
});
