import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetFlatList } from '@gorhom/bottom-sheet';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Restaurant, MapBounds } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import NaverMap from '../../components/NaverMap';
import { RestaurantCard } from '../../components/RestaurantCard';
import FloatingActionButton from '../../components/FloatingActionButton';
import { lightTap } from '../../utils/haptics';

const INITIAL_BOUNDS: MapBounds = { minLat: 37.4, maxLat: 37.7, minLng: 126.8, maxLng: 127.2 };

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['12%', '40%', '80%'], []);

  const fetchRestaurants = useCallback(async (bounds: MapBounds) => {
    try {
      const response = await restaurantApi.getRestaurants(bounds);
      setRestaurants(response.content);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetch = useCallback((bounds: MapBounds) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchRestaurants(bounds), 500);
  }, [fetchRestaurants]);

  useEffect(() => {
    fetchRestaurants(INITIAL_BOUNDS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchRestaurants]);

  const handleMarkerClick = useCallback((restaurant: Restaurant) => {
    lightTap();
    setSelected(restaurant);
    bottomSheetRef.current?.snapToIndex(1);
  }, []);

  const renderListItem = useCallback(({ item, index }: { item: Restaurant; index: number }) => (
    <RestaurantCard item={item} index={index} />
  ), []);

  return (
    <View style={styles.container}>
      <NaverMap
        restaurants={restaurants}
        onMarkerClick={handleMarkerClick}
        onBoundsChange={debouncedFetch}
      />

      <FloatingActionButton />

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
        {selected ? (
          // 선택된 맛집 미리보기
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

            {/* 나머지 목록 */}
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
          // 주변 맛집 리스트
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyText: { textAlign: 'center', color: '#999', paddingVertical: 30, fontSize: 14 },
});
