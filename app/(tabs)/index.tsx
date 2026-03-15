import { StyleSheet, View, Text, TextInput, ActivityIndicator, TouchableOpacity, FlatList, Keyboard, Linking, Platform } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { lightTap, mediumTap } from '../../utils/haptics';
import { showError } from '../../utils/toast';

const INITIAL_BOUNDS: MapBounds = { minLat: 37.4, maxLat: 37.7, minLng: 126.8, maxLng: 127.2 };

export default function MapScreen() {
  const c = useTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [locating, setLocating] = useState(false);
  const [showResearchBtn, setShowResearchBtn] = useState(false);

  const { searchQuery, searchResults, searching, handleSearch, clearSearch } = useSearch();
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<NaverMapViewRef>(null);
  const currentBoundsRef = useRef<MapBounds>(INITIAL_BOUNDS);
  const snapPoints = useMemo(() => ['18%', '45%', '60%', '85%'], []);

  const fetchRestaurants = useCallback(async (bounds: MapBounds) => {
    try {
      const response = await restaurantApi.getRestaurants(bounds);
      setRestaurants(response.content);
      setShowResearchBtn(false);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const Location = require('expo-location') as typeof LocationType;
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = location.coords;
          mapRef.current?.animateCameraTo({ latitude, longitude, zoom: 15 });
          const bounds: MapBounds = {
            minLat: latitude - 0.01,
            maxLat: latitude + 0.01,
            minLng: longitude - 0.01,
            maxLng: longitude + 0.01,
          };
          fetchRestaurants(bounds);
          return;
        }
      } catch {}
      fetchRestaurants(INITIAL_BOUNDS);
    })();
  }, [fetchRestaurants]);

  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    currentBoundsRef.current = bounds;
    setShowResearchBtn(true);
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
    bottomSheetRef.current?.snapToIndex(2);
  };

  const closePlaceDetail = () => {
    setSelectedPlace(null);
    bottomSheetRef.current?.snapToIndex(0);
  };

  const openNaverMap = (place: PlaceResult) => {
    lightTap();
    const url = Platform.select({
      ios: `nmap://place?lat=${place.lat}&lng=${place.lng}&name=${encodeURIComponent(place.name)}&appname=com.mindbridge.wishmap`,
      android: `nmap://place?lat=${place.lat}&lng=${place.lng}&name=${encodeURIComponent(place.name)}&appname=com.mindbridge.wishmap`,
    });
    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(place.name)}`);
        }
      });
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
      mapRef.current?.animateCameraTo({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        zoom: 15,
      });
    } catch {
      showError('위치 오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setLocating(false);
    }
  }, []);

  const handleMarkerClick = useCallback((restaurant: Restaurant) => {
    lightTap();
    setSelected(restaurant);
    setSelectedPlace(null);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const renderListItem = useCallback(({ item, index }: { item: Restaurant; index: number }) => (
    <RestaurantCard item={item} index={index} />
  ), []);

  const showResults = searchFocused && searchResults.length > 0;

  return (
    <View style={styles.container}>
      <NaverMap
        ref={mapRef}
        restaurants={restaurants}
        onMarkerClick={handleMarkerClick}
        onBoundsChange={handleBoundsChange}
      />

      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: c.surface, shadowColor: '#000' }, searchFocused && { shadowOpacity: 0.2, shadowRadius: 12 }]}>
          <Ionicons name="search-outline" size={18} color={c.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: c.textPrimary }]}
            placeholder="맛집 검색"
            placeholderTextColor={c.textDisabled}
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            returnKeyType="search"
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

      {showResearchBtn && (
        <Animated.View entering={FadeInDown.duration(200)} style={styles.researchContainer}>
          <TouchableOpacity
            style={styles.researchBtn}
            onPress={handleResearch}
            activeOpacity={0.85}
          >
            <Ionicons name="refresh-outline" size={16} color="#fff" />
            <Text style={styles.researchText}>현재 지도에서 재검색</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* 오른쪽: 내 위치 버튼 */}
      <View style={styles.rightButtons}>
        <TouchableOpacity
          style={[styles.mapBtn, { backgroundColor: c.surface }]}
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
        backgroundStyle={[styles.sheetBg, { backgroundColor: c.sheetBg }]}
        handleIndicatorStyle={{ backgroundColor: c.textDisabled, width: 40 }}
        enablePanDownToClose={false}
      >
        {selectedPlace ? (
          <PlaceDetailSheet
            place={selectedPlace}
            onClose={closePlaceDetail}
            onOpenNaverMap={openNaverMap}
            onCallPhone={callPhone}
          />
        ) : selected ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.preview}>
            <View style={styles.previewHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.previewTitleRow}>
                  <Text style={[styles.previewName, { color: c.textPrimary }]} numberOfLines={1}>{selected.name}</Text>
                  {selected.category && (
                    <Text style={[styles.previewCategory, { backgroundColor: c.categoryBadgeBg, color: c.categoryBadgeText }]}>{selected.category}</Text>
                  )}
                </View>
                <Text style={[styles.previewAddress, { color: c.textSecondary }]} numberOfLines={1}>{selected.address}</Text>
                <Text style={[styles.previewLikes, { color: c.primary }]}>❤️ {selected.likeCount}</Text>
              </View>
              <TouchableOpacity
                style={[styles.previewClose, { backgroundColor: c.closeButtonBg }]}
                onPress={() => { setSelected(null); bottomSheetRef.current?.snapToIndex(0); }}
              >
                <Ionicons name="close" size={20} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.detailBtn}
              onPress={() => { lightTap(); router.push(`/restaurant/${selected.id}`); }}
              activeOpacity={0.8}
            >
              <Text style={styles.detailBtnText}>상세보기</Text>
              <Ionicons name="chevron-forward" size={16} color="#fff" />
            </TouchableOpacity>

            <View style={styles.listHeader}>
              <Text style={[styles.listTitle, { color: c.textPrimary }]}>주변 맛집 {restaurants.length}개</Text>
            </View>
            <BottomSheetFlatList
              data={restaurants.filter(r => r.id !== selected.id)}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContent}
            />
          </Animated.View>
        ) : (
          <View style={styles.listWrap}>
            <View style={styles.listHeader}>
              <Ionicons name="restaurant" size={18} color={c.primary} />
              <Text style={[styles.listTitle, { color: c.textPrimary }]}>주변 맛집 {restaurants.length}개</Text>
            </View>
            <BottomSheetFlatList
              data={restaurants}
              keyExtractor={(item) => item.id.toString()}
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
    height: 46,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
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
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#FF6B35',
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
    bottom: '20%',
    zIndex: 5,
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
  previewAddress: { fontSize: 13, marginBottom: 4 },
  previewLikes: { fontSize: 13 },
  previewClose: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  detailBtn: {
    flexDirection: 'row',
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  detailBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
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
