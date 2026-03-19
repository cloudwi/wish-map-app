import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceResult } from '../api/search';
import { restaurantApi, PlaceStatsResponse } from '../api/restaurant';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { lightTap, successTap } from '../utils/haptics';
import { showError, showSuccess } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';
import { formatRelativeDate } from '../utils/formatDate';

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
}

export function PlaceDetailSheet({ place, onClose, onOpenNaverMap, onCallPhone, onVisitSuccess }: PlaceDetailSheetProps) {
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
    restaurantApi.getPlaceStats(place.id).then(setStats).catch(() => setStats(null));
  }, [place.id]);

  const [visitLoading, setVisitLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [visitedToday, setVisitedToday] = useState(false);

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
    <Animated.View
      entering={FadeIn.duration(200)}
      style={[styles.container, { paddingBottom: insets.bottom + TAB_BAR_HEIGHT }]}
    >
      {/* 장소명 + 닫기 */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={[styles.placeName, { color: c.textPrimary }]} numberOfLines={1}>{place.name}</Text>
          {place.category ? (
            <View style={[styles.categoryBadge, { backgroundColor: c.categoryBadgeBg }]}>
              <Text style={[styles.categoryText, { color: c.categoryBadgeText }]} numberOfLines={1}>{place.category}</Text>
            </View>
          ) : null}
        </View>
        <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.closeButtonBg }]} onPress={onClose}>
          <Ionicons name="close" size={18} color={c.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 주소 */}
      {address ? (
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color={c.textTertiary} />
            <Text style={[styles.infoText, { color: c.textSecondary }]} numberOfLines={1}>{address}</Text>
          </View>
        </View>
      ) : null}

      {/* 외부 링크 액션 */}
      <View style={[styles.actions, { borderTopColor: c.divider, borderBottomColor: c.divider }]}>
        <TouchableOpacity
          style={[styles.actionPill, { backgroundColor: c.successBg }]}
          onPress={() => onOpenNaverMap(place)}
          activeOpacity={0.75}
        >
          <Ionicons name="map-outline" size={14} color={c.success} />
          <Text style={[styles.actionPillText, { color: c.success }]}>네이버 지도</Text>
        </TouchableOpacity>
        {place.phone ? (
          <TouchableOpacity
            style={[styles.actionPill, { backgroundColor: c.infoBg }]}
            onPress={() => onCallPhone(place.phone)}
            activeOpacity={0.75}
          >
            <Ionicons name="call-outline" size={14} color={c.info} />
            <Text style={[styles.actionPillText, { color: c.info }]}>전화</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 통계 섹션 */}
      <View style={[styles.statsSection, { borderTopColor: c.divider }]}>
        {stats === undefined ? (
          <ActivityIndicator size="small" color={c.textDisabled} />
        ) : stats === null || stats.visitCount === 0 ? (
          <Text style={[styles.statsEmpty, { color: c.textDisabled }]}>
            아직 방문 기록이 없어요. 첫 번째가 되어보세요! 🎉
          </Text>
        ) : (
          <>
            <View style={styles.statsSummary}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>👣</Text>
                <Text style={[styles.statValue, { color: c.textPrimary }]}>방문 {stats.visitCount}회</Text>
              </View>
            </View>
            {stats.recentReviews.length > 0 && (
              <View style={[styles.reviewList, { borderTopColor: c.divider }]}>
                {stats.recentReviews.map((review, i) => (
                  <View key={i} style={styles.reviewItem}>
                    <View style={styles.reviewHeader}>
                      <Text style={[styles.reviewNickname, { color: c.textSecondary }]} numberOfLines={1}>
                        👤 {review.nickname}
                      </Text>
                      {review.createdAt && (
                        <Text style={[styles.reviewDate, { color: c.textTertiary }]}>
                          {formatRelativeDate(review.createdAt)}
                        </Text>
                      )}
                    </View>
                    <Text style={[styles.reviewContent, { color: c.textPrimary }]} numberOfLines={2}>
                      {review.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </View>

      {/* CTA 버튼 */}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  headerInfo: {
    flex: 1,
    gap: 5,
  },
  placeName: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 24,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info rows
  infoSection: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    flex: 1,
  },

  // Action pills
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    marginBottom: 14,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  actionPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Stats section
  statsSection: {
    paddingVertical: 12,
    borderTopWidth: 0.5,
    marginBottom: 14,
    minHeight: 36,
    justifyContent: 'center',
  },
  statsEmpty: {
    fontSize: 12,
    textAlign: 'center',
  },
  statsSummary: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  reviewList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 0.5,
    gap: 8,
  },
  reviewItem: {
    gap: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewNickname: {
    fontSize: 11,
    fontWeight: '600',
  },
  reviewDate: {
    fontSize: 10,
  },
  reviewContent: {
    fontSize: 12,
    lineHeight: 17,
  },

  // CTA buttons
  ctas: {
    gap: 8,
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
    borderRadius: 12,
  },
  visitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  reportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
