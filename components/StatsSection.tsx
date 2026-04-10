import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { restaurantApi } from '../api/restaurant';
import { useTheme } from '../hooks/useTheme';
import { PlaceCategory } from '../types';
import { lightTap } from '../utils/haptics';

interface StatsSectionProps {
  placeCategories: PlaceCategory[];
}

export function StatsSection({ placeCategories }: StatsSectionProps) {
  const c = useTheme();
  const [weeklyTop, setWeeklyTop] = useState<any[]>([]);
  const [popular, setPopular] = useState<any[]>([]);
  const [categorySummary, setCategorySummary] = useState<any[]>([]);

  useEffect(() => {
    restaurantApi.getWeeklyTop().then(setWeeklyTop).catch(() => {});
    restaurantApi.getPopular().then(setPopular).catch(() => {});
    restaurantApi.getCategorySummary().then(data => {
      // Map category names from placeCategories
      const mapped = data.map(item => ({
        ...item,
        name: placeCategories.find(cat => cat.id === item.placeCategoryId)?.name || '기타',
        icon: placeCategories.find(cat => cat.id === item.placeCategoryId)?.icon,
      }));
      setCategorySummary(mapped);
    }).catch(() => {});
  }, [placeCategories]);

  if (weeklyTop.length === 0 && popular.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* 이번 주 HOT */}
      {weeklyTop.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionEmoji]}>🔥</Text>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>이번 주 HOT</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
            {weeklyTop.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.rankCard, { backgroundColor: c.cardBg, borderColor: c.border }]}
                onPress={() => { lightTap(); router.push(`/restaurant/${item.id}`); }}
                activeOpacity={0.8}
              >
                <View style={[styles.rankBadge, { backgroundColor: idx === 0 ? '#FF6B35' : idx === 1 ? '#FF9F1C' : '#FFD166' }]}>
                  <Text style={styles.rankNumber}>{idx + 1}</Text>
                </View>
                {item.thumbnailImage ? (
                  <Image source={{ uri: item.thumbnailImage }} style={styles.rankImage} contentFit="cover" />
                ) : (
                  <View style={[styles.rankImage, { backgroundColor: c.imagePlaceholderBg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="restaurant-outline" size={20} color={c.textDisabled} />
                  </View>
                )}
                <Text style={[styles.rankName, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.rankMeta, { color: c.primary }]}>이번 주 {item.visitCount}회</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 인기 장소 TOP5 */}
      {popular.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionEmoji]}>👑</Text>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>인기 장소</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
            {popular.map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.rankCard, { backgroundColor: c.cardBg, borderColor: c.border }]}
                onPress={() => { lightTap(); router.push(`/restaurant/${item.id}`); }}
                activeOpacity={0.8}
              >
                <View style={[styles.rankBadge, { backgroundColor: c.primary }]}>
                  <Text style={styles.rankNumber}>{idx + 1}</Text>
                </View>
                {item.thumbnailImage ? (
                  <Image source={{ uri: item.thumbnailImage }} style={styles.rankImage} contentFit="cover" />
                ) : (
                  <View style={[styles.rankImage, { backgroundColor: c.imagePlaceholderBg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="restaurant-outline" size={20} color={c.textDisabled} />
                  </View>
                )}
                <Text style={[styles.rankName, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.rankMeta, { color: c.textSecondary }]}>총 {item.totalVisitCount}회 방문</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 카테고리 통계 */}
      {categorySummary.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionEmoji]}>📊</Text>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>카테고리</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
            {categorySummary.map((item) => (
              <View
                key={item.placeCategoryId}
                style={[styles.categoryCard, { backgroundColor: c.cardBg, borderColor: c.border }]}
              >
                <Text style={styles.categoryIcon}>{item.icon || '📍'}</Text>
                <Text style={[styles.categoryName, { color: c.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.categoryCount, { color: c.textSecondary }]}>{item.restaurantCount}개</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 10 },
  sectionEmoji: { fontSize: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  cardRow: { paddingHorizontal: 14, gap: 10 },
  rankCard: {
    width: 130,
    borderRadius: 12,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  rankNumber: { color: '#fff', fontSize: 12, fontWeight: '800' },
  rankImage: { width: '100%', height: 90 },
  rankName: { fontSize: 13, fontWeight: '600', paddingHorizontal: 10, paddingTop: 8 },
  rankMeta: { fontSize: 11, paddingHorizontal: 10, paddingBottom: 10, paddingTop: 2 },
  categoryCard: {
    width: 90,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: 'center',
    gap: 4,
  },
  categoryIcon: { fontSize: 24 },
  categoryName: { fontSize: 12, fontWeight: '600' },
  categoryCount: { fontSize: 11 },
});
