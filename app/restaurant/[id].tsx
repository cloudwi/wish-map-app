import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, RefreshControl, Linking, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useState, useEffect, useCallback } from 'react';
import { useLocalSearchParams, Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RestaurantDetail } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import { searchPlaceImages } from '../../api/search';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { showError, showSuccess } from '../../utils/toast';
import { lightTap, successTap } from '../../utils/haptics';
import Skeleton from '../../components/Skeleton';

export default function RestaurantDetailScreen() {
  const c = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();

  const [restaurant, setRestaurant] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [visitLoading, setVisitLoading] = useState(false);
  const [searchImages, setSearchImages] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    try {
      const restaurantData = await restaurantApi.getRestaurantDetail(Number(id));
      setRestaurant(restaurantData);
      if (!restaurantData.thumbnailImage && restaurantData.images.length === 0) {
        searchPlaceImages(restaurantData.name, 3).then(setSearchImages);
      }
    } catch (error) {
      console.error('Failed to fetch restaurant:', error);
    }
    setLoading(false);
    setRefreshing(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleOpenNaverMap = async () => {
    if (!restaurant) return;
    lightTap();
    const appUrl = `nmap://place?lat=${restaurant.lat}&lng=${restaurant.lng}&name=${encodeURIComponent(restaurant.name)}&appname=com.wishmap.app`;
    const webUrl = restaurant.naverPlaceId
      ? `https://m.place.naver.com/place/${restaurant.naverPlaceId}/home`
      : `https://map.naver.com/v5/search/${encodeURIComponent(restaurant.name)}`;
    try {
      const supported = await Linking.canOpenURL(appUrl);
      await Linking.openURL(supported ? appUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const handleVisit = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      setVisitLoading(true);
      const Location = require('expo-location') as typeof import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      await restaurantApi.verifyVisit(
        Number(id),
        location.coords.latitude,
        location.coords.longitude
      );
      successTap();
      setRestaurant(prev => prev ? {
        ...prev,
        isVisited: true,
        visitCount: (prev.visitCount ?? 0) + 1,
      } : null);
    } catch (error: any) {
      const message = error?.response?.data?.message || '방문 인증 중 오류가 발생했습니다.';
      showError('방문 인증 실패', message);
    } finally {
      setVisitLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.surface }]}>
        <Skeleton width="100%" height={280} borderRadius={0} />
        <View style={styles.skeletonInfo}>
          <View style={styles.skeletonTitleRow}>
            <Skeleton width="60%" height={26} borderRadius={6} />
            <Skeleton width={60} height={24} borderRadius={6} />
          </View>
          <Skeleton width={80} height={14} borderRadius={4} />
          <Skeleton width="45%" height={14} borderRadius={4} style={{ marginTop: 4 }} />
          <View style={styles.skeletonNavRow}>
            <Skeleton width={16} height={16} borderRadius={8} />
            <Skeleton width={50} height={14} borderRadius={4} />
          </View>
          <View style={styles.skeletonMeta}>
            <Skeleton width={80} height={12} borderRadius={4} />
            <Skeleton width={70} height={12} borderRadius={4} />
          </View>
        </View>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: c.surface }]}>
        <Ionicons name="alert-circle-outline" size={48} color={c.textDisabled} />
        <Text style={{ color: c.textSecondary, marginTop: 12 }}>장소 정보를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: restaurant.name,
          headerStyle: { backgroundColor: c.headerBg },
          headerTintColor: c.textPrimary,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.container, { backgroundColor: c.surface }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 80 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[c.primary]} />
          }
        >
          {/* 메인 이미지 */}
          {(() => {
            const allImages = restaurant.images.length > 0
              ? restaurant.images
              : restaurant.thumbnailImage
                ? [restaurant.thumbnailImage]
                : searchImages;
            return allImages.length > 0 ? (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {allImages.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={[styles.mainImage, { backgroundColor: c.imagePlaceholderBg }]} contentFit="cover" />
                ))}
              </ScrollView>
            ) : (
              <View style={[styles.mainImage, styles.imagePlaceholder, { backgroundColor: c.imagePlaceholderBg }]}>
                <Ionicons name="location-outline" size={48} color="#d4c4bc" />
              </View>
            );
          })()}

          {/* 기본 정보 */}
          <View style={styles.infoSection}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={[styles.name, { color: c.textPrimary }]}>{restaurant.name}</Text>
                {restaurant.category && (
                  <Text style={[styles.category, { backgroundColor: c.categoryBadgeBg, color: c.categoryBadgeText }]}>{restaurant.category}</Text>
                )}
              </View>
              <View style={styles.actions}>
                <Text style={[styles.visitCountBadge, { color: c.textSecondary }]}>방문 {restaurant.visitCount}회</Text>
              </View>
            </View>

            {/* 길찾기 링크 */}
            <TouchableOpacity
              style={styles.naverMapLink}
              onPress={handleOpenNaverMap}
              activeOpacity={0.7}
            >
              <Ionicons name="navigate-outline" size={16} color="#1EC800" />
              <Text style={[styles.naverMapLinkText, { color: c.textSecondary }]}>길찾기</Text>
              <Ionicons name="open-outline" size={12} color={c.textDisabled} />
            </TouchableOpacity>

            {restaurant.description && (
              <Text style={[styles.description, { color: c.textPrimary }]}>{restaurant.description}</Text>
            )}

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: c.textTertiary }]}>
                제안: {restaurant.suggestedBy.nickname}
              </Text>
              <Text style={[styles.metaText, { color: c.textTertiary }]}>
                {new Date(restaurant.createdAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 하단 고정: 방문 인증 */}
        <View style={[styles.bottomBar, { backgroundColor: c.surface, borderTopColor: c.divider }]}>
          <TouchableOpacity
            style={[
              styles.bottomButton,
              restaurant.isVisited
                ? { backgroundColor: c.chipBg }
                : { backgroundColor: c.primary },
            ]}
            onPress={handleVisit}
            disabled={restaurant.isVisited || visitLoading}
            activeOpacity={0.8}
          >
            {visitLoading ? (
              <ActivityIndicator size="small" color={restaurant.isVisited ? c.textSecondary : '#fff'} />
            ) : restaurant.isVisited ? (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={[styles.bottomButtonText, { color: c.textSecondary }]}>오늘 인증 완료</Text>
              </>
            ) : (
              <>
                <Ionicons name="footsteps-outline" size={16} color="#fff" />
                <Text style={[styles.bottomButtonText, { color: '#fff' }]}>방문 인증</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // 메인 이미지
  mainImage: { width: SCREEN_WIDTH, height: 280 },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },

  // 기본 정보
  infoSection: { padding: 20 },
  header: { marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  name: { fontSize: 24, fontWeight: '700', flex: 1 },
  category: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, fontSize: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  visitCountBadge: { fontSize: 14, fontWeight: '600' },

  // 길찾기 링크
  naverMapLink: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12,
  },
  naverMapLinkText: { fontSize: 13 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },

  // 하단 고정 바
  bottomBar: {
    paddingHorizontal: 16, paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 12,
    borderTopWidth: 0.5,
  },
  bottomButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12,
  },
  bottomButtonText: { fontSize: 14, fontWeight: '600' },

  // 스켈레톤
  skeletonInfo: { padding: 20, gap: 10 },
  skeletonTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  skeletonNavRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  skeletonMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
});
