import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Keyboard, Linking } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import type * as LocationType from 'expo-location';
import { type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import type { CameraChangeReason } from '@mj-studio/react-native-naver-map';
import { Place, MapBounds, PlaceCategory } from '../../types';
import { placeApi } from '../../api/place';
import { placeCategoryApi } from '../../api/placeCategory';
import { PlaceResult } from '../../api/search';
import NaverMap from '../../components/NaverMap';
import { PlaceDetailSheet } from '../../components/PlaceDetailSheet';
import { SearchBar } from '../../components/map/SearchBar';
import { FilterChips, TrendFilter } from '../../components/map/FilterChips';
import { MapControls } from '../../components/map/MapControls';
import { useSearch } from '../../hooks/useSearch';
import { useTheme } from '../../hooks/useTheme';
import { useGroupStore } from '../../stores/groupStore';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { lightTap, mediumTap } from '../../utils/haptics';
import { showError } from '../../utils/toast';
import { router, useFocusEffect } from 'expo-router';
import { RecommendSlot } from '../../components/RecommendSlot';

const INITIAL_BOUNDS: MapBounds = { minLat: 37.4, maxLat: 37.7, minLng: 126.8, maxLng: 127.2 };

export default function MapScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Place | null>(null);
  const [showResearchBtn, setShowResearchBtn] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const initialLoadDone = useRef(false);

  const { searchQuery, searchResults, searching, handleSearch, searchNow, clearSearch } = useSearch();
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { groups, selectedGroupId, fetchGroups } = useGroupStore();
  const [placeCategories, setPlaceCategories] = useState<PlaceCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [trendFilter, setTrendFilter] = useState<TrendFilter | null>(null);
  const [statsRefreshKey, setStatsRefreshKey] = useState(0);

  const [slotVisible, setSlotVisible] = useState(false);
  const [slotCandidates, setSlotCandidates] = useState<Place[]>([]);
  const [slotWinner, setSlotWinner] = useState<Place | null>(null);

  const detailSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<NaverMapViewRef>(null);
  const currentBoundsRef = useRef<MapBounds>(INITIAL_BOUNDS);
  const currentCameraRef = useRef<{ latitude: number; longitude: number; zoom: number }>({ latitude: 37.5665, longitude: 126.9780, zoom: 14 });

  useEffect(() => {
    if (isAuthenticated) fetchGroups();
  }, [isAuthenticated]);

  useEffect(() => {
    placeCategoryApi.getPlaceCategories()
      .then(setPlaceCategories)
      .catch(() => {});
  }, []);

  // F6: 그룹 선택/해제 시 카메라 이동 + 맛집 재조회. 필터 전환이므로 즉시 fetch.
  // 첫 mount에서는 초기 fetch가 별도 useEffect에서 수행되므로 스킵.
  const isFirstGroupEffect = useRef(true);
  useEffect(() => {
    if (isFirstGroupEffect.current) { isFirstGroupEffect.current = false; return; }

    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group?.baseLat && group?.baseLng) {
        const radius = group.baseRadius || 1000;
        const zoom = radius <= 300 ? 17 : radius <= 500 ? 16 : 15;
        mapRef.current?.animateCameraTo({
          latitude: group.baseLat, longitude: group.baseLng, zoom,
        });
      }
    }
    // 그룹 선택/해제 모두 fetchPlaces 내부에서 groupId 기반으로 적절한 bounds 사용.
    if (currentBoundsRef.current) {
      fetchPlaces(currentBoundsRef.current);
    }
  }, [selectedGroupId]);

  // 트렌드 필터 변경 시 자동 조회 (첫 mount 제외)
  const isFirstTrendEffect = useRef(true);
  useEffect(() => {
    if (isFirstTrendEffect.current) { isFirstTrendEffect.current = false; return; }
    if (currentBoundsRef.current) {
      fetchPlaces(currentBoundsRef.current);
    }
  }, [trendFilter]);

  const fetchPlaces = useCallback(async (bounds: MapBounds, placeCategoryId?: number | null) => {
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

      // 트렌드 필터 적용
      const trendCategoryId = trendFilter?.placeCategoryId;
      const trendTags = trendFilter?.tags;
      const trendPriceRange = trendFilter?.priceRange;

      const response = groupId
        ? await placeApi.getGroupPlaces(groupId, effectiveBounds)
        : await placeApi.getPlaces({
            bounds,
            placeCategoryId: trendCategoryId || effectiveCategoryId || undefined,
            tags: trendTags,
            priceRange: trendPriceRange as any,
            size: 500,
          });
      setPlaces(response.content);
      setShowResearchBtn(false);
    } catch (error) {
      console.warn('[fetchPlaces]', error);
    } finally {
      setLoading(false);
      setTimeout(() => { initialLoadDone.current = true; }, 500);
    }
  }, [categoryFilter, trendFilter]);

  // 화면 포커스 시 stats + 장소 목록 재조회 (방문 인증/장소 등록 후 돌아올 때)
  // fetchPlaces 선언 이후에 배치하여 TS block-scoped variable 순서 오류 회피.
  useFocusEffect(useCallback(() => {
    setStatsRefreshKey(k => k + 1);
    if (currentBoundsRef.current && initialLoadDone.current) {
      fetchPlaces(currentBoundsRef.current);
    }
  }, [fetchPlaces]));

  // visit-review 등 다른 화면에서 재사용할 수 있도록 현재 위치를 store에 싱크.
  useEffect(() => {
    if (userLocation) {
      useLocationStore.getState().setUserLocation(userLocation);
    }
  }, [userLocation]);

  // F2: mounted flag로 unmount 후 state 업데이트 방지
  const initialMountFetchedRef = useRef(false);
  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    let mounted = true;
    // 화면 진입 즉시 1회 조회. GPS 권한/응답을 기다리지 않고 초기 bounds로 우선 표시.
    if (!initialMountFetchedRef.current) {
      initialMountFetchedRef.current = true;
      fetchPlaces(INITIAL_BOUNDS);
    }
    (async () => {
      try {
        const Location = require('expo-location') as typeof LocationType;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted) return;
        if (status === 'granted') {
          let location = await Location.getLastKnownPositionAsync();
          if (!location) {
            location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          }
          if (!mounted) return;
          const { latitude, longitude } = location.coords;
          setUserLocation({ latitude, longitude });
          // B안: GPS 도착 시 카메라만 이동. 뷰포트 변경은 재검색 버튼으로 사용자가 트리거.
          mapRef.current?.animateCameraTo({ latitude, longitude, zoom: 15 });
          subscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
            (loc) => { if (mounted) setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude }); },
          );
        }
      } catch (e) {
        console.warn('[Location Error]', e);
      }
    })();
    return () => { mounted = false; subscription?.remove(); };
  }, [fetchPlaces]);

  // B안: 카메라가 정지할 때마다 "재검색" 버튼만 노출. 자동 fetch 없음.
  // 초기 조회는 mount useEffect에서, 필터/그룹 변경은 각 effect에서 직접 fetch.
  const handleBoundsChange = useCallback((
    bounds: MapBounds,
    camera: { latitude: number; longitude: number; zoom: number },
    _reason: CameraChangeReason,
  ) => {
    currentBoundsRef.current = bounds;
    currentCameraRef.current = camera;
    if (!initialLoadDone.current) return;
    setShowResearchBtn(true);
  }, []);

  const handleResearch = useCallback(() => {
    mediumTap();
    fetchPlaces(currentBoundsRef.current);
  }, [fetchPlaces]);

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
    setTimeout(() => detailSheetRef.current?.expand(), 100);
  };

  const closePlaceDetail = () => {
    detailSheetRef.current?.close();
    setSelectedPlace(null);
    setSelected(null);
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

  // 마커 탭 → 상세 시트 즉시 오픈. 이미 가진 Place 데이터로 즉시 렌더,
  // 주소/전화는 백그라운드 네이버 검색으로 보강 (네트워크 대기 없음).
  const handleMarkerClick = useCallback((tapped: Place) => {
    lightTap();
    setSelected(tapped);
    setSelectedPlace({
      id: tapped.naverPlaceId || '',
      name: tapped.name,
      address: '',
      roadAddress: '',
      lat: tapped.lat,
      lng: tapped.lng,
      category: tapped.category || '',
      phone: '',
      link: '',
    });
    setTimeout(() => detailSheetRef.current?.expand(), 50);

    // 백그라운드로 주소/전화 보강
    (async () => {
      try {
        const { searchPlaces } = require('../../api/search');
        const results: PlaceResult[] = await searchPlaces(tapped.name);
        if (!results.length) return;
        const match = results.reduce((closest, r) => {
          const dR = Math.abs(r.lat - tapped.lat) + Math.abs(r.lng - tapped.lng);
          const dC = Math.abs(closest.lat - tapped.lat) + Math.abs(closest.lng - tapped.lng);
          return dR < dC ? r : closest;
        });
        setSelectedPlace(prev => prev && prev.name === tapped.name ? {
          ...prev,
          address: match.address || prev.address,
          roadAddress: match.roadAddress || prev.roadAddress,
          phone: match.phone || prev.phone,
          link: match.link || prev.link,
          id: prev.id || match.id || '',
        } : prev);
      } catch {}
    })();
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
    const nearby = places.filter((r) => {
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
  }, [places, userLocation, clearSearch]);

  const handleSlotResult = useCallback((place: Place) => {
    setSlotVisible(false);
    handleMarkerClick(place);
    mapRef.current?.animateCameraTo({ latitude: place.lat, longitude: place.lng, zoom: 16 });
  }, [handleMarkerClick]);

  return (
    <View style={styles.container}>
      {/* 지도 화면에서는 항상 밝은 상태바 (그라데이션 오버레이와 함께) */}
      <StatusBar style="light" />
      <NaverMap
        ref={mapRef}
        places={places}
        placeCategories={placeCategories}
        onMarkerClick={handleMarkerClick}
        onBoundsChange={handleBoundsChange}
        onTapMap={() => { Keyboard.dismiss(); setSelected(null); }}
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
        onSearchNow={searchNow}
        onClearSearch={clearSearch}
        onSelectPlace={handleSelectPlace}
        placeCategories={placeCategories}
        selectedCategoryId={categoryFilter}
        onCategoryChange={(catId) => {
          setCategoryFilter(catId);
          if (currentBoundsRef.current) {
            fetchPlaces(currentBoundsRef.current, catId);
          }
        }}
        onRegisterCustomPlace={handleRegisterCustomPlace}
      />

      {/* 그룹 + 트렌드 필터 (한 줄) */}
      <FilterChips
        top={insets.top + 60}
        activeTrend={trendFilter}
        onTrendSelect={(filter) => {
          setTrendFilter(filter);
          setCategoryFilter(null);
        }}
      />

      {showResearchBtn && (
        <View style={[styles.researchContainer, { top: insets.top + 100 }]}>
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

      {selectedPlace && (
        <BottomSheet
          ref={detailSheetRef}
          enableDynamicSizing
          enablePanDownToClose
          onClose={() => { setSelectedPlace(null); setSelected(null); }}
          backgroundStyle={[styles.sheetBg, { backgroundColor: c.sheetBg }]}
          handleIndicatorStyle={{ backgroundColor: c.textDisabled, width: 40 }}
          containerStyle={{ zIndex: 20 }}
        >
          <BottomSheetView>
            <PlaceDetailSheet
              place={selectedPlace}
              restaurantId={selected?.id ?? null}
              initialSummary={selected ? {
                visitCount: selected.visitCount,
                priceRange: selected.priceRange,
                placeCategoryId: selected.placeCategoryId,
                lastVisitedAt: selected.lastVisitedAt,
                thumbnailImage: selected.thumbnailImage,
              } : null}
              onClose={closePlaceDetail}
              onOpenNaverMap={openNaverMap}
              onCallPhone={callPhone}
              onVisitSuccess={() => fetchPlaces(currentBoundsRef.current)}
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
});
