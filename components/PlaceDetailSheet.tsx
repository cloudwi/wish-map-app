import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceResult, searchPlaceImage } from '../api/search';
import { placeApi, PlaceStatsResponse } from '../api/place';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { lightTap } from '../utils/haptics';
import { PRICE_RANGE_LABELS, PlaceCategory } from '../types';
import { CategoryPlaceholder } from './CategoryPlaceholder';

const TAB_BAR_HEIGHT = 49;

interface PlaceDetailSheetProps {
  place: PlaceResult;
  onClose: () => void;
  onOpenNaverMap: (place: PlaceResult) => void;
  onCallPhone: (phone: string) => void;
  onVisitSuccess?: () => void;
  weeklyChampion?: string | null;
  placeCategories?: PlaceCategory[];
  refreshKey?: number;
}

export function PlaceDetailSheet({ place, onClose, onOpenNaverMap, onCallPhone, onVisitSuccess, weeklyChampion, placeCategories, refreshKey }: PlaceDetailSheetProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<PlaceStatsResponse | null | undefined>(undefined);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);

  const refreshStats = useCallback(() => {
    if (!place.id) { setStats(null); return; }
    placeApi.getPlaceStats(place.id).then(setStats).catch(() => setStats(null));
  }, [place.id]);

  // place 변경 시 초기화 + 조회, refreshKey 변경 시 조용히 재조회
  useEffect(() => {
    setStats(undefined);
    refreshStats();
  }, [refreshStats]);

  useEffect(() => {
    if (refreshKey) refreshStats();
  }, [refreshKey]);


  useEffect(() => {
    setThumbnail(null);
    searchPlaceImage(place.name).then(setThumbnail);
  }, [place.name]);

  const visitedToday = stats?.visitedToday ?? false;

  const handleVisit = () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    lightTap();
    router.push({
      pathname: '/visit-review',
      params: {
        placeName: place.name,
        placeLat: String(place.lat),
        placeLng: String(place.lng),
        placeId: place.id || '',
        placeCategory: place.category || '',
        restaurantId: stats?.restaurantId ? String(stats.restaurantId) : '',
        placeCategoryId: stats?.placeCategoryId ? String(stats.placeCategoryId) : '',
      },
    });
    onClose();
  };

  const address = place.roadAddress || place.address;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 20 }]}>
      {/* 썸네일 + 장소명 + 닫기 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerTap}
          activeOpacity={0.7}
          onPress={async () => {
            lightTap();
            if (stats?.restaurantId) {
              router.push(`/restaurant/${stats.restaurantId}`);
              return;
            }
            if (!isAuthenticated) { router.push('/login'); return; }
            if (registering) return;
            try {
              setRegistering(true);
              const created = await placeApi.createRestaurant({
                name: place.name,
                lat: place.lat,
                lng: place.lng,
                naverPlaceId: place.id || undefined,
                category: place.category || undefined,
              });
              setStats({ restaurantId: created.id, visitCount: 0, avgRating: null, visitedToday: false, priceRange: null, placeCategoryId: created.placeCategoryId ?? null, recentReviews: [], lastVisitedAt: null });
              router.push(`/restaurant/${created.id}`);
            } catch (e: any) {
              // 이미 등록된 장소면 stats 재조회
              if (place.id) {
                const refreshed = await placeApi.getPlaceStats(place.id).catch(() => null);
                if (refreshed?.restaurantId) {
                  setStats(refreshed);
                  router.push(`/restaurant/${refreshed.restaurantId}`);
                  return;
                }
              }
            } finally {
              setRegistering(false);
            }
          }}
        >
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <CategoryPlaceholder
                icon={placeCategories?.find(cat => cat.id === stats?.placeCategoryId)?.icon}
                size={52}
              />
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={[styles.placeName, { color: c.textPrimary }]} numberOfLines={1}>{place.name}</Text>
            <View style={styles.headerMeta}>
              {place.category ? (
                <View style={[styles.badge, { backgroundColor: c.categoryBadgeBg }]}>
                  <Text style={[styles.badgeText, { color: c.categoryBadgeText }]} numberOfLines={1}>{place.category}</Text>
                </View>
              ) : null}
              {stats?.priceRange ? (
                <View style={[styles.badge, { backgroundColor: c.primaryBg }]}>
                  <Text style={[styles.badgeText, { color: c.primary }]}>{PRICE_RANGE_LABELS[stats.priceRange]}</Text>
                </View>
              ) : null}
              {stats && stats.visitCount > 0 && (
                <Text style={[styles.visitCount, { color: c.textSecondary }]}>방문 {stats.visitCount}회</Text>
              )}
            </View>
            {stats?.lastVisitedAt && (
              <Text style={[styles.lastVisitText, { color: c.textTertiary }]}>
                최근 방문 {new Date(stats.lastVisitedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {new Date(stats.lastVisitedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <SymbolView
            name="xmark.circle.fill"
            size={34}
            type="hierarchical"
            tintColor={c.textSecondary}
            fallback={<Ionicons name="close-circle" size={28} color={c.textDisabled} />}
          />
        </TouchableOpacity>
      </View>

      {/* 방문왕 */}
      {weeklyChampion && (
        <Text style={[styles.championText, { color: c.textSecondary }]}>방문왕 {weeklyChampion}</Text>
      )}

      {/* 주소 + 네이버 지도 */}
      <View style={styles.subInfo}>
        {address ? (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color={c.textTertiary} />
            <Text style={[styles.infoText, { color: c.textTertiary }]} numberOfLines={1}>{address}</Text>
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.naverMapBtn, { borderColor: c.success }]}
          onPress={() => onOpenNaverMap(place)}
          activeOpacity={0.75}
        >
          <Ionicons name="map-outline" size={14} color={c.success} />
          <Text style={[styles.naverMapBtnText, { color: c.success }]}>네이버 지도</Text>
        </TouchableOpacity>
      </View>

      {/* 전화 */}
      {place.phone ? (
        <TouchableOpacity
          style={[styles.phonePill, { backgroundColor: c.gray100 }]}
          onPress={() => onCallPhone(place.phone)}
          activeOpacity={0.75}
        >
          <Ionicons name="call-outline" size={12} color={c.info} />
          <Text style={[styles.actionPillText, { color: c.info }]}>전화 {place.phone}</Text>
        </TouchableOpacity>
      ) : null}

      {/* CTA */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={[styles.visitBtn, { backgroundColor: visitedToday ? c.successBg : c.primary }, visitedToday && { opacity: 1 }]}
          onPress={handleVisit}
          activeOpacity={0.8}
          disabled={visitedToday}
        >
          {visitedToday ? (
            <>
              <Ionicons name="checkmark-circle" size={17} color={c.success} />
              <Text style={[styles.visitBtnText, { color: c.success }]}>오늘 완료</Text>
            </>
          ) : (
            <>
              <Ionicons name="footsteps-outline" size={17} color="#fff" />
              <Text style={styles.visitBtnText}>방문 인증</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  headerTap: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerInfo: { flex: 1, gap: 4 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  thumbnail: { width: 52, height: 52, borderRadius: 10 },
  thumbnailPlaceholder: { width: 52, height: 52, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  placeName: { fontSize: 17, fontWeight: '600', lineHeight: 22 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: '500' },
  visitCount: { fontSize: 12, fontWeight: '600' },
  lastVisitText: { fontSize: 11, marginTop: 4 },
  championText: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  closeBtn: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
  subInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  infoText: { fontSize: 11, flex: 1 },
  naverMapBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, marginLeft: 8, flexShrink: 0 },
  naverMapBtnText: { fontSize: 13, fontWeight: '600' },
  phonePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginBottom: 6 },
  actionPillText: { fontSize: 13, fontWeight: '600' },
  cta: { paddingTop: 8 },
  visitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 8 },
  visitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
