import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { restaurantApi } from '../api/restaurant';
import { placeCategoryApi } from '../api/placeCategory';
import { lightTap, successTap, mediumTap } from '../utils/haptics';
import { showError, showSuccess } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';
import {
  PriceRange, PRICE_RANGE_LABELS, PRICE_RANGES,
  PlaceCategory, DEFAULT_PLACE_CATEGORIES,
} from '../types';

const VISIT_DISTANCE_LIMIT = 100;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function VisitReviewScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    placeName: string;
    placeLat: string;
    placeLng: string;
    placeId: string;
    placeCategory: string;
    restaurantId: string;
  }>();

  const [placeCategories, setPlaceCategories] = useState<PlaceCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const selectedCategory = placeCategories.find(c => c.id === selectedCategoryId);

  useEffect(() => {
    placeCategoryApi.getPlaceCategories()
      .then(setPlaceCategories)
      .catch(() => setPlaceCategories(DEFAULT_PLACE_CATEGORIES));
  }, []);

  const selectCategory = (id: number) => {
    lightTap();
    if (selectedCategoryId === id) return;
    setSelectedCategoryId(id);
    setSelectedTags([]);
    setSelectedPriceRange(null);
  };

  const togglePriceRange = (pr: PriceRange) => {
    lightTap();
    setSelectedPriceRange(prev => prev === pr ? null : pr);
  };

  const toggleTag = (tag: string) => {
    lightTap();
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!selectedCategoryId) {
      showError('카테고리 필수', '장소 카테고리를 선택해주세요.');
      return;
    }

    setSubmitting(true);
    mediumTap();

    try {
      // GPS 확인
      const Location = require('expo-location') as typeof import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
        return;
      }
      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      const dist = haversineDistance(
        loc.coords.latitude, loc.coords.longitude,
        Number(params.placeLat), Number(params.placeLng)
      );
      if (dist > VISIT_DISTANCE_LIMIT) {
        const distText = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`;
        showError('장소 근처에서 시도해주세요', `현재 ${distText} 떨어져 있어요.`);
        return;
      }

      const result = await restaurantApi.quickVisit({
        name: params.placeName,
        lat: Number(params.placeLat),
        lng: Number(params.placeLng),
        naverPlaceId: params.placeId || undefined,
        category: params.placeCategory || undefined,
        userLat: loc.coords.latitude,
        userLng: loc.coords.longitude,
        priceRange: selectedPriceRange || undefined,
        placeCategoryId: selectedCategoryId,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      successTap();
      showSuccess('방문 인증 완료!');
      router.replace(`/restaurant/${result.restaurantId}`);
    } catch (error: unknown) {
      const msg = getErrorMessage(error, '방문 인증 중 오류가 발생했습니다.');
      if (msg.includes('이미') && msg.includes('방문')) {
        showError('이미 방문 완료', '오늘 이미 방문 인증한 장소입니다.');
        const rid = params.restaurantId ? Number(params.restaurantId) : null;
        if (rid) router.replace(`/restaurant/${rid}`);
      } else {
        showError('방문 인증 실패', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.background, borderBottomColor: c.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>방문 인증</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: c.textTertiary }]}>취소</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* 장소 정보 */}
        <View style={[styles.placeCard, { backgroundColor: c.cardBg }]}>
          <Ionicons name="location" size={20} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.placeName, { color: c.textPrimary }]}>{params.placeName}</Text>
            {params.placeCategory ? (
              <Text style={[styles.placeCategory, { color: c.textTertiary }]}>{params.placeCategory}</Text>
            ) : null}
          </View>
        </View>

        {/* 카테고리 선택 (필수) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>카테고리</Text>
            <Text style={[styles.required, { color: c.error }]}>필수</Text>
          </View>
          <View style={styles.chipGrid}>
            {placeCategories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.chip,
                    { backgroundColor: c.chipBg, borderColor: c.border },
                    isSelected && { backgroundColor: c.primaryBg, borderColor: c.primary },
                  ]}
                  onPress={() => selectCategory(cat.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.chipText,
                    { color: c.textSecondary },
                    isSelected && { color: c.primary, fontWeight: '600' },
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 가격대 (음식 카테고리일 때만 표시, 선택) */}
        {selectedCategory?.hasPriceRange && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>가격대</Text>
            <View style={styles.chipGrid}>
              {PRICE_RANGES.map((pr) => {
                const isSelected = selectedPriceRange === pr;
                return (
                  <TouchableOpacity
                    key={pr}
                    style={[
                      styles.chip,
                      { backgroundColor: c.chipBg, borderColor: c.border },
                      isSelected && { backgroundColor: c.primaryBg, borderColor: c.primary },
                    ]}
                    onPress={() => togglePriceRange(pr)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: c.textSecondary },
                      isSelected && { color: c.primary, fontWeight: '600' },
                    ]}>
                      {PRICE_RANGE_LABELS[pr]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* 카테고리별 태그 */}
        {selectedCategory?.tagGroups.map((group) => (
          <View key={group.key} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{group.key}</Text>
            <View style={styles.chipGrid}>
              {group.tags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.chip,
                      { backgroundColor: c.chipBg, borderColor: c.border },
                      isSelected && { backgroundColor: c.chipActiveBg, borderColor: c.chipActiveBg },
                    ]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: c.textSecondary },
                      isSelected && { color: c.chipActiveText, fontWeight: '600' },
                    ]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* 제출 */}
        <TouchableOpacity
          style={[
            styles.submitBtn,
            { backgroundColor: selectedCategoryId ? c.primary : c.gray400 },
            submitting && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={submitting || !selectedCategoryId}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitText}>방문 인증</Text>
            </>
          )}
        </TouchableOpacity>

        {!selectedCategoryId && (
          <Text style={[styles.hint, { color: c.textDisabled }]}>카테고리를 선택하면 인증할 수 있어요</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  skipText: { fontSize: 14, fontWeight: '500' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  placeName: { fontSize: 17, fontWeight: '600' },
  placeCategory: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  required: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 12 },
});
