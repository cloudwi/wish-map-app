import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceResult, searchPlaceImage } from '../api/search';
import { restaurantApi, PlaceStatsResponse } from '../api/restaurant';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { lightTap } from '../utils/haptics';
import { TaggedContent } from './TaggedContent';
import { PRICE_RANGE_LABELS } from '../types';

const TAB_BAR_HEIGHT = 49;

interface PlaceDetailSheetProps {
  place: PlaceResult;
  onClose: () => void;
  onOpenNaverMap: (place: PlaceResult) => void;
  onCallPhone: (phone: string) => void;
  onVisitSuccess?: () => void;
  weeklyChampion?: string | null;
}

export function PlaceDetailSheet({ place, onClose, onOpenNaverMap, onCallPhone, onVisitSuccess, weeklyChampion }: PlaceDetailSheetProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<PlaceStatsResponse | null | undefined>(undefined);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!place.id) { setStats(null); return; }
    setStats(undefined);
    restaurantApi.getPlaceStats(place.id).then(setStats).catch(() => setStats(null));
  }, [place.id]);

  useEffect(() => {
    setThumbnail(null);
    searchPlaceImage(place.name + ' 맛집').then(setThumbnail);
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
      },
    });
  };

  const address = place.roadAddress || place.address;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 20 }]}>
      {/* 썸네일 + 장소명 + 닫기 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerTap}
          activeOpacity={0.7}
          onPress={() => { if (stats?.restaurantId) { lightTap(); router.push(`/restaurant/${stats.restaurantId}`); } }}
        >
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: c.searchBg }]}>
              <Ionicons name="restaurant-outline" size={22} color={c.textDisabled} />
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
              {stats ? (
                <View style={[styles.badge, { backgroundColor: c.primaryBg }]}>
                  <Text style={[styles.badgeText, { color: c.primary }]}>{PRICE_RANGE_LABELS[stats.priceRange]}</Text>
                </View>
              ) : null}
              {stats && stats.visitCount > 0 && (
                <Text style={[styles.visitCount, { color: c.textSecondary }]}>방문 {stats.visitCount}회</Text>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.closeButtonBg }]} onPress={onClose}>
          <Ionicons name="close" size={18} color={c.textSecondary} />
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

      {/* 리뷰 섹션 */}
      <View style={[styles.reviewSection, { borderTopColor: c.divider }]}>
        {stats && stats.recentReviews.length > 0 ? (
          <>
            <TaggedContent content={stats.recentReviews[0].content} />
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => { lightTap(); router.push(`/restaurant/${stats.restaurantId}`); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.moreBtnText, { color: c.textTertiary }]}>더보기</Text>
              <Ionicons name="chevron-forward" size={14} color={c.textTertiary} />
            </TouchableOpacity>
          </>
        ) : stats !== undefined ? (
          <TouchableOpacity style={styles.moreBtn} onPress={handleVisit} activeOpacity={0.7}>
            <Text style={[styles.moreBtnText, { color: c.textTertiary }]}>첫 방문평을 남겨보세요!</Text>
            <Ionicons name="chevron-forward" size={14} color={c.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

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
  championText: { fontSize: 12, fontWeight: '500', marginBottom: 8 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  subInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  infoText: { fontSize: 11, flex: 1 },
  naverMapBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, marginLeft: 8, flexShrink: 0 },
  naverMapBtnText: { fontSize: 13, fontWeight: '600' },
  phonePill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, marginBottom: 6 },
  actionPillText: { fontSize: 13, fontWeight: '600' },
  reviewSection: { paddingVertical: 8, borderTopWidth: 0.5, gap: 6 },
  moreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  moreBtnText: { fontSize: 12, fontWeight: '500' },
  cta: { paddingTop: 8 },
  visitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 8 },
  visitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
