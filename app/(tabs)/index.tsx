import { StyleSheet, View, Text, TextInput, ActivityIndicator, TouchableOpacity, FlatList, Keyboard, Linking, ScrollView } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import type * as LocationType from 'expo-location';
import { type NaverMapViewRef } from '@mj-studio/react-native-naver-map';
import { Restaurant, MapBounds } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { PlaceResult } from '../../api/search';
import NaverMap from '../../components/NaverMap';
import { RestaurantCard } from '../../components/RestaurantCard';
import { PlaceDetailSheet } from '../../components/PlaceDetailSheet';
import { useSearch } from '../../hooks/useSearch';
import { useTheme } from '../../hooks/useTheme';
import { useGroupStore } from '../../stores/groupStore';
import { useAuthStore } from '../../stores/authStore';
import { lightTap, mediumTap } from '../../utils/haptics';
import { showError, showSuccess } from '../../utils/toast';
import { getErrorMessage } from '../../utils/getErrorMessage';

const INITIAL_BOUNDS: MapBounds = { minLat: 37.4, maxLat: 37.7, minLng: 126.8, maxLng: 127.2 };

export default function MapScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [locating, setLocating] = useState(false);
  const [showResearchBtn, setShowResearchBtn] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const initialLoadDone = useRef(false);

  const { searchQuery, searchResults, searching, handleSearch, searchNow, clearSearch } = useSearch();
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const { isAuthenticated } = useAuthStore();
  const { groups, selectedGroupId, selectGroup, fetchGroups } = useGroupStore();
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<NaverMapViewRef>(null);
  const currentBoundsRef = useRef<MapBounds>(INITIAL_BOUNDS);
  const currentCameraRef = useRef<{ latitude: number; longitude: number; zoom: number }>({ latitude: 37.5665, longitude: 126.9780, zoom: 14 });
  const defaultSnapPoints = useMemo(() => ['28%', '55%', '75%'], []);
  const placeSnapPoints = useMemo(() => ['28%', '38%'], []);
  const snapPoints = selectedPlace ? placeSnapPoints : defaultSnapPoints;

  useEffect(() => {
    if (isAuthenticated) fetchGroups();
  }, [isAuthenticated]);

  const fetchRestaurants = useCallback(async (bounds: MapBounds) => {
    try {
      const groupId = useGroupStore.getState().selectedGroupId;
      const response = groupId
        ? await restaurantApi.getGroupRestaurants(groupId, bounds)
        : await restaurantApi.getRestaurants(bounds);
      setRestaurants(response.content);
      setShowResearchBtn(false);
    } catch {
      // silently fail – map will show empty state
    } finally {
      setLoading(false);
      setTimeout(() => { initialLoadDone.current = true; }, 500);
    }
  }, []);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;
    (async () => {
      try {
        const Location = require('expo-location') as typeof LocationType;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
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
      } catch {}
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
    setSearchFocused(false);
    setSelected(null);
    setSelectedPlace(place);
    Keyboard.dismiss();

    mapRef.current?.animateCameraTo({
      latitude: place.lat,
      longitude: place.lng,
      zoom: 16,
    });
    bottomSheetRef.current?.snapToIndex(1);
  };

  const closePlaceDetail = () => {
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
      : `https://m.place.naver.com/search?query=${encodeURIComponent(place.name)}`;
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

  const goToMyLocation = useCallback(async () => {
    mediumTap();
    setLocating(true);
    try {
      const Location = require('expo-location') as typeof LocationType;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });
      mapRef.current?.animateCameraTo({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        zoom: currentCameraRef.current.zoom,
      });
    } catch {
      showError('위치 오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setLocating(false);
    }
  }, []);

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
    // naverPlaceId가 있으면 네이버 검색으로 주소/전화번호 보강
    if (restaurant.naverPlaceId) {
      try {
        const { searchPlaces } = require('../../api/search');
        const results = await searchPlaces(restaurant.name);
        const match = results.find((r: PlaceResult) => `${r.id}` === restaurant.naverPlaceId);
        if (match) {
          place.address = match.address;
          place.roadAddress = match.roadAddress;
          place.phone = match.phone;
          place.link = match.link;
        }
      } catch {}
    }
    setSelectedPlace(place);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const renderListItem = useCallback(({ item, index }: { item: Restaurant; index: number }) => (
    <RestaurantCard item={item} index={index} />
  ), []);

  const showResults = searchResults.length > 0;

  return (
    <View style={styles.container}>
      <NaverMap
        ref={mapRef}
        restaurants={restaurants}
        onMarkerClick={handleMarkerClick}
        onBoundsChange={handleBoundsChange}
        userLocation={userLocation}
        selectedPlace={selectedPlace}
        selectedId={selected?.id ?? null}
      />

      {/* 검색바 */}
      <View style={[styles.searchContainer, { top: insets.top + 8 }]}>
        <View style={[styles.searchBar, { backgroundColor: c.surface, shadowColor: '#000' }, searchFocused && { shadowOpacity: 0.2, shadowRadius: 12 }]}>
          <Ionicons name="search-outline" size={20} color={c.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: c.textPrimary }]}
            placeholder="장소 검색"
            placeholderTextColor={c.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            returnKeyType="search"
            onSubmitEditing={() => { searchNow(); setSearchFocused(true); }}
          />
          {searching && <ActivityIndicator size="small" color={c.primary} />}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color={c.textDisabled} />
            </TouchableOpacity>
          )}
        </View>

        {showResults && (
          <Animated.View entering={FadeIn.duration(150)} style={[styles.searchResults, { backgroundColor: c.surface }]}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.resultItem, { borderBottomColor: c.divider }, index === searchResults.length - 1 && styles.resultItemLast]}
                  onPress={() => handleSelectPlace(item)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="location-outline" size={18} color={c.primary} />
                  <View style={styles.resultContent}>
                    <Text style={[styles.resultName, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.resultAddress, { color: c.textSecondary }]} numberOfLines={1}>
                      {item.roadAddress || item.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}
      </View>

      {/* 그룹 선택 칩 */}
      {isAuthenticated && groups.length > 0 && (
        <View style={[styles.groupChips, { top: insets.top + 60 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 16 }}>
            {groups.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={[styles.groupChip, { backgroundColor: c.surface, borderColor: selectedGroupId === g.id ? c.primary : c.border },
                  selectedGroupId === g.id && { backgroundColor: c.primary + '15' }]}
                onPress={() => {
                  lightTap();
                  selectGroup(g.id);
                  fetchRestaurants(currentBoundsRef.current);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="people" size={13} color={selectedGroupId === g.id ? c.primary : c.textTertiary} />
                <Text style={[styles.groupChipText, { color: selectedGroupId === g.id ? c.primary : c.textSecondary }]}>{g.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.groupChip, { backgroundColor: c.surface, borderColor: c.border }]}
              onPress={() => router.push('/group-manage')}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={13} color={c.textTertiary} />
              <Text style={[styles.groupChipText, { color: c.textTertiary }]}>그룹 관리</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {showResearchBtn && (
        <Animated.View entering={FadeInDown.duration(200)} style={[styles.researchContainer, { top: insets.top + (groups.length > 0 ? 96 : 62) }]}>
          <TouchableOpacity
            style={[styles.researchBtn, { backgroundColor: c.primary, shadowColor: c.primary }]}
            onPress={handleResearch}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.researchText}>현재 지도에서 재검색</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 오른쪽 버튼: 줌 + 내 위치 */}
      <View style={styles.rightButtons}>
        <TouchableOpacity
          style={[styles.mapBtn, { backgroundColor: c.surface }]}
          onPress={() => {
            lightTap();
            const cam = currentCameraRef.current;
            mapRef.current?.animateCameraTo({ latitude: cam.latitude, longitude: cam.longitude, zoom: cam.zoom + 1, duration: 200 });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={22} color={c.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapBtn, { backgroundColor: c.surface }]}
          onPress={() => {
            lightTap();
            const cam = currentCameraRef.current;
            mapRef.current?.animateCameraTo({ latitude: cam.latitude, longitude: cam.longitude, zoom: cam.zoom - 1, duration: 200 });
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="remove" size={22} color={c.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mapBtn, { backgroundColor: c.surface, marginTop: 4 }]}
          onPress={goToMyLocation}
          activeOpacity={0.8}
          disabled={locating}
        >
          <Ionicons
            name={locating ? 'locate' : 'locate-outline'}
            size={22}
            color={locating ? c.primary : c.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: c.loadingOverlay }]}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        topInset={insets.top + 60}
        backgroundStyle={[styles.sheetBg, { backgroundColor: c.sheetBg }]}
        handleIndicatorStyle={{ backgroundColor: c.textDisabled, width: 40 }}
        enablePanDownToClose={false}
        containerStyle={{ zIndex: 10 }}
      >
        {selectedPlace ? (
          <PlaceDetailSheet
            place={selectedPlace}
            onClose={closePlaceDetail}
            onOpenNaverMap={openNaverMap}
            onCallPhone={callPhone}
            onVisitSuccess={() => fetchRestaurants(currentBoundsRef.current)}
          />
        ) : (
          <View style={styles.listWrap}>
            <View style={styles.listHeader}>
              <Ionicons name="restaurant" size={18} color={c.primary} />
              <Text style={[styles.listTitle, { color: c.textPrimary }]}>주변 맛집 {restaurants.length}개</Text>
            </View>
            <BottomSheetFlatList
              data={restaurants}
              keyExtractor={(item: Restaurant) => item.id.toString()}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={[styles.emptyText, { color: c.textSecondary }]}>
                  {loading ? '맛집을 불러오는 중...' : '이 지역에 등록된 맛집이 없습니다'}
                </Text>
              }
            />
          </View>
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 0 },
  clearBtn: { padding: 8 },
  searchResults: {
    marginTop: 6,
    borderRadius: 12,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  resultItemLast: { borderBottomWidth: 0 },
  resultContent: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  resultAddress: { fontSize: 13 },
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
    borderRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  researchText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  rightButtons: {
    position: 'absolute',
    right: 16,
    top: '45%',
    zIndex: 1,
    elevation: 2,
    gap: 8,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  preview: { flex: 1, paddingHorizontal: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  previewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  previewName: { fontSize: 18, fontWeight: '700', flex: 1 },
  previewCategory: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, fontSize: 12,
  },
  previewLikes: { fontSize: 13 },
  previewClose: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  previewActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  previewVisitBtn: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  previewReviewBtn: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 10,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
  },
  previewDetailBtn: {
    width: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewActionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  previewReviewText: { fontSize: 14, fontWeight: '600' },
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
  groupChips: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
