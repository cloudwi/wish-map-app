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
import { lightTap, successTap } from '../utils/haptics';
import { showError, showSuccess } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';
import { TaggedContent } from './TaggedContent';


const VISIT_DISTANCE_LIMIT = 100; // meters

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

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

  useEffect(() => {
    if (!place.id) {
      setStats(null);
      return;
    }
    setStats(undefined);
    restaurantApi.getPlaceStats(place.id).then((data) => {
      setStats(data);
      if (data?.visitedToday) setVisitedToday(true);
    }).catch(() => setStats(null));
  }, [place.id]);

  const [visitLoading, setVisitLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [visitedToday, setVisitedToday] = useState(false);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    setThumbnail(null);
    searchPlaceImage(place.name + ' 맛집').then(setThumbnail);
  }, [place.name]);

  const getUserLocation = async () => {
    const Location = require('expo-location') as typeof import('expo-location');
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      showError('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
      return null;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const dist = haversineDistance(loc.coords.latitude, loc.coords.longitude, place.lat, place.lng);
    if (dist > VISIT_DISTANCE_LIMIT) {
      const distText = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`;
      showError('가게 근처에서 시도해주세요', `현재 ${distText} 떨어져 있어요. 가게에서 ${VISIT_DISTANCE_LIMIT}m 이내로 가까이 가주세요!`);
      return null;
    }
    return loc.coords;
  };

  const handleVisit = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    lightTap();
    setVisitLoading(true);
    try {
      const coords = await getUserLocation();
      if (!coords) return;
      await restaurantApi.quickVisit({
        name: place.name,
        lat: place.lat,
        lng: place.lng,
        naverPlaceId: place.id || undefined,
        category: place.category || undefined,
        userLat: coords.latitude,
        userLng: coords.longitude,
      });
      successTap();
      showSuccess('방문 인증 완료!', '방문이 기록되었습니다.');
      setVisitedToday(true);
      if (place.id) {
        restaurantApi.getPlaceStats(place.id).then(setStats).catch(() => {});
      }
      onVisitSuccess?.();
    } catch (error: unknown) {
      const msg = getErrorMessage(error, '방문 인증 중 오류가 발생했습니다.');
      if (msg.includes('이미') && msg.includes('방문')) {
        setVisitedToday(true);
      } else {
        showError('방문 인증 실패', msg);
      }
    } finally {
      setVisitLoading(false);
    }
  };

  const handleReport = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    lightTap();
    setReportLoading(true);
    try {
      const coords = await getUserLocation();
      if (!coords) return;
      router.push({
        pathname: '/visit-review',
        params: {
          placeName: place.name,
          placeLat: String(place.lat),
          placeLng: String(place.lng),
          placeId: place.id || '',
          placeCategory: place.category || '',
        },
      });
    } catch {
      showError('위치 오류', '현재 위치를 가져올 수 없습니다.');
    } finally {
      setReportLoading(false);
    }
  };

  const address = place.roadAddress || place.address;

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT + 20 }]}
    >
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
                <View style={[styles.categoryBadge, { backgroundColor: c.categoryBadgeBg }]}>
                  <Text style={[styles.categoryText, { color: c.categoryBadgeText }]} numberOfLines={1}>{place.category}</Text>
                </View>
              ) : null}
              {stats && stats.visitCount > 0 && (
                <Text style={[styles.visitCountInline, { color: c.textSecondary }]}>방문 {stats.visitCount}회</Text>
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
          style={[styles.naverMapBtn, { borderColor: c.success, marginLeft: 8, flexShrink: 0 }]}
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
              style={styles.reviewMoreBtn}
              onPress={() => { lightTap(); router.push(`/restaurant/${stats.restaurantId}`); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.reviewMoreText, { color: c.textTertiary }]}>더보기</Text>
              <Ionicons name="chevron-forward" size={14} color={c.textTertiary} />
            </TouchableOpacity>
          </>
        ) : stats !== undefined ? (
          <TouchableOpacity
            style={styles.reviewMoreBtn}
            onPress={handleReport}
            activeOpacity={0.7}
          >
            <Text style={[styles.reviewMoreText, { color: c.textTertiary }]}>
              첫 리뷰를 작성해보세요!
            </Text>
            <Ionicons name="chevron-forward" size={14} color={c.textTertiary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* CTA 버튼 - 하단 고정 */}
      <View style={styles.ctas}>
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={[styles.visitBtn, { backgroundColor: visitedToday ? c.successBg : c.primary }, (visitLoading || visitedToday) && { opacity: visitedToday ? 1 : 0.6 }]}
            onPress={handleVisit}
            activeOpacity={0.8}
            disabled={visitLoading || reportLoading || visitedToday}
          >
            {visitLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : visitedToday ? (
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
          <TouchableOpacity
            style={[styles.reportBtn, { borderColor: c.primary }, reportLoading && { opacity: 0.6 }]}
            onPress={handleReport}
            activeOpacity={0.8}
            disabled={visitLoading || reportLoading}
          >
            {reportLoading ? (
              <ActivityIndicator size="small" color={c.primary} />
            ) : (
              <>
                <Ionicons name="create-outline" size={17} color={c.primary} />
                <Text style={[styles.reportBtnText, { color: c.primary }]}>리뷰</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  // Header
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 10,
  },
  thumbnailPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  visitCountInline: {
    fontSize: 12,
    fontWeight: '600',
  },
  placeName: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  championText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sub info (address + actions)
  subInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  infoText: {
    fontSize: 11,
    flex: 1,
  },
  naverMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  naverMapBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  phonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 6,
  },
  actionPillText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Review section
  reviewSection: {
    paddingVertical: 8,
    borderTopWidth: 0.5,
    gap: 6,
  },
  reviewMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  reviewMoreText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // CTA buttons
  ctas: {
    gap: 8,
    paddingTop: 8,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 8,
  },
  visitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  reportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 8,
    borderWidth: 1,
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
