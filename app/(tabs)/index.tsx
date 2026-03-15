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
import { searchPlaces, PlaceResult } from '../../api/search';
import NaverMap from '../../components/NaverMap';
import { RestaurantCard } from '../../components/RestaurantCard';
import { lightTap, mediumTap } from '../../utils/haptics';
import { showError } from '../../utils/toast';

const INITIAL_BOUNDS: MapBounds = { minLat: 37.4, maxLat: 37.7, minLng: 126.8, maxLng: 127.2 };

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [locating, setLocating] = useState(false);
  const [showResearchBtn, setShowResearchBtn] = useState(false);

  // 검색
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
    fetchRestaurants(INITIAL_BOUNDS);
  }, [fetchRestaurants]);

  // 지도 이동 시 자동 조회 대신 "재검색" 버튼 표시
  const handleBoundsChange = useCallback((bounds: MapBounds) => {
    currentBoundsRef.current = bounds;
    setShowResearchBtn(true);
  }, []);

  const handleResearch = useCallback(() => {
    mediumTap();
    fetchRestaurants(currentBoundsRef.current);
  }, [fetchRestaurants]);

  // 검색
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(text);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSelectPlace = (place: PlaceResult) => {
    lightTap();
    setSearchQuery('');
    setSearchResults([]);
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

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
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
        <View style={[styles.searchBar, searchFocused && styles.searchBarFocused]}>
          <Ionicons name="search-outline" size={18} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="맛집 검색"
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color="#FF6B35" />}
          {searchQuery.length > 0 && !searching && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#ccc" />
            </TouchableOpacity>
          )}
        </View>

        {/* 검색 결과 드롭다운 */}
        {showResults && (
          <Animated.View entering={FadeIn.duration(150)} style={styles.searchResults}>
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[styles.resultItem, index === searchResults.length - 1 && styles.resultItemLast]}
                  onPress={() => handleSelectPlace(item)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="location-outline" size={18} color="#FF6B35" />
                  <View style={styles.resultContent}>
                    <Text style={styles.resultName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.resultAddress} numberOfLines={1}>
                      {item.roadAddress || item.address}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </Animated.View>
        )}
      </View>

      {/* 현재 지도에서 재검색 버튼 */}
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
          style={styles.mapBtn}
          onPress={goToMyLocation}
          activeOpacity={0.8}
          disabled={locating}
        >
          <Ionicons
            name={locating ? 'locate' : 'locate-outline'}
            size={22}
            color={locating ? '#FF6B35' : '#555'}
          />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      )}

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.sheetHandle}
        enablePanDownToClose={false}
      >
        {selectedPlace ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.preview}>
            {/* 장소명 + 닫기 */}
            <View style={styles.previewHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.placeName}>{selectedPlace.name}</Text>
                {selectedPlace.category ? (
                  <Text style={styles.placeCategory}>{selectedPlace.category}</Text>
                ) : null}
              </View>
              <TouchableOpacity style={styles.previewClose} onPress={closePlaceDetail}>
                <Ionicons name="close" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* 액션 버튼 */}
            <View style={styles.placeActions}>
              <TouchableOpacity style={styles.placeActionBtn} onPress={() => openNaverMap(selectedPlace)}>
                <View style={[styles.placeActionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="storefront-outline" size={20} color="#1EC800" />
                </View>
                <Text style={styles.placeActionText}>상세보기</Text>
              </TouchableOpacity>
              {selectedPlace.phone ? (
                <TouchableOpacity style={styles.placeActionBtn} onPress={() => callPhone(selectedPlace.phone)}>
                  <View style={[styles.placeActionIcon, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="call-outline" size={20} color="#2196F3" />
                  </View>
                  <Text style={styles.placeActionText}>전화</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* 주소 */}
            <View style={styles.placeInfoSection}>
              <View style={styles.placeInfoRow}>
                <Ionicons name="location-outline" size={18} color="#888" />
                <Text style={styles.placeInfoText}>
                  {selectedPlace.roadAddress || selectedPlace.address}
                </Text>
              </View>
              {selectedPlace.phone ? (
                <View style={styles.placeInfoRow}>
                  <Ionicons name="call-outline" size={18} color="#888" />
                  <Text style={styles.placeInfoText}>{selectedPlace.phone}</Text>
                </View>
              ) : null}
            </View>

            {/* 리뷰 */}
            <View style={styles.placeReviewSection}>
              <Text style={styles.placeReviewTitle}>리뷰</Text>
              <TouchableOpacity
                style={styles.firstReviewBtn}
                onPress={() => {
                  lightTap();
                  // TODO: 리뷰 작성 화면으로 이동
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FF6B35" />
                <Text style={styles.firstReviewText}>첫 리뷰 작성하기</Text>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        ) : selected ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.preview}>
            <View style={styles.previewHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.previewTitleRow}>
                  <Text style={styles.previewName} numberOfLines={1}>{selected.name}</Text>
                  {selected.category && (
                    <Text style={styles.previewCategory}>{selected.category}</Text>
                  )}
                </View>
                <Text style={styles.previewAddress} numberOfLines={1}>{selected.address}</Text>
                <Text style={styles.previewLikes}>❤️ {selected.likeCount}</Text>
              </View>
              <TouchableOpacity
                style={styles.previewClose}
                onPress={() => { setSelected(null); bottomSheetRef.current?.snapToIndex(0); }}
              >
                <Ionicons name="close" size={20} color="#999" />
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
              <Text style={styles.listTitle}>주변 맛집 {restaurants.length}개</Text>
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
              <Ionicons name="restaurant" size={18} color="#FF6B35" />
              <Text style={styles.listTitle}>주변 맛집 {restaurants.length}개</Text>
            </View>
            <BottomSheetFlatList
              data={restaurants}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
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
  // 검색
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBarFocused: {
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#333', paddingVertical: 0 },
  clearBtn: { padding: 8 },
  searchResults: {
    marginTop: 6,
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
  },
  resultItemLast: { borderBottomWidth: 0 },
  resultContent: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  resultAddress: { fontSize: 13, color: '#999' },
  // 재검색 버튼
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
  // 오른쪽 버튼 그룹
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
    backgroundColor: '#fff',
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
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 바텀시트
  sheetBg: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sheetHandle: { backgroundColor: '#ddd', width: 40 },
  preview: { flex: 1, paddingHorizontal: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  previewTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  previewName: { fontSize: 18, fontWeight: '700', color: '#333', flex: 1 },
  previewCategory: {
    backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, fontSize: 12, color: '#666',
  },
  previewAddress: { fontSize: 13, color: '#888', marginBottom: 4 },
  previewLikes: { fontSize: 13, color: '#FF6B35' },
  previewClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center',
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
  listTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 30, fontSize: 14 },
  // 검색 장소 상세
  placeName: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  placeCategory: { fontSize: 13, color: '#888', marginBottom: 4 },
  placeActions: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  placeActionBtn: { alignItems: 'center', gap: 6 },
  placeActionIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  placeActionText: { fontSize: 12, color: '#555', fontWeight: '500' },
  placeInfoSection: { paddingVertical: 16, gap: 12 },
  placeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  placeInfoText: { fontSize: 14, color: '#333', flex: 1 },
  placeReviewSection: {
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  placeReviewTitle: { fontSize: 16, fontWeight: '700', color: '#191F28', marginBottom: 12 },
  firstReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFE0D0',
  },
  firstReviewText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FF6B35' },
});
