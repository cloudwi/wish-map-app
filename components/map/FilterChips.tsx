import { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
import { trendTagApi, TrendTagResponse } from '../../api/trendTag';
import { lightTap } from '../../utils/haptics';

export interface TrendFilter {
  label: string;
  placeCategoryId?: number;
  tags?: string[];
  priceRange?: string;
}

interface FilterChipsProps {
  top: number;
  activeTrend: TrendFilter | null;
  onTrendSelect: (filter: TrendFilter | null) => void;
}

export function FilterChips({ top, activeTrend, onTrendSelect }: FilterChipsProps) {
  const c = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { groups, selectedGroupId } = useGroupStore();
  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;
  const [trends, setTrends] = useState<TrendTagResponse[]>([]);

  useEffect(() => {
    trendTagApi.getTrendTags()
      .then(setTrends)
      .catch((e) => console.warn('[FilterChips] trend-tags fetch failed:', e?.message));
  }, []);

  const isTrendActive = (t: TrendTagResponse) => activeTrend?.label === t.label;

  const toFilter = (t: TrendTagResponse): TrendFilter => ({
    label: t.label,
    placeCategoryId: t.placeCategoryId ?? undefined,
    tags: t.tags ?? undefined,
    priceRange: t.priceRange ?? undefined,
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, { top }]}
      contentContainerStyle={styles.content}
    >
      {/* 그룹 칩 — 비로그인 시에도 노출. 탭 시 로그인으로 유도 */}
      <TouchableOpacity
        style={[
          styles.chip,
          selectedGroup
            ? { backgroundColor: c.primary + '15', borderColor: c.primary }
            : { backgroundColor: c.surface, borderColor: c.border },
        ]}
        onPress={() => {
          lightTap();
          router.push(isAuthenticated ? '/group-manage' : '/login');
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name={selectedGroup ? 'people' : 'people-outline'}
          size={13}
          color={selectedGroup ? c.primary : c.textTertiary}
        />
        <Text style={[styles.chipText, { color: selectedGroup ? c.primary : c.textTertiary }]}>
          {selectedGroup ? selectedGroup.name : groups.length > 0 ? '그룹 선택' : '+ 그룹'}
        </Text>
      </TouchableOpacity>

      {/* 구분선 */}
      {trends.length > 0 && (
        <View style={[styles.divider, { backgroundColor: c.border }]} />
      )}

      {/* 트렌드 칩 */}
      {trends.map((t) => (
        <TouchableOpacity
          key={t.id}
          style={[
            styles.chip,
            isTrendActive(t)
              ? { backgroundColor: c.primary + '15', borderColor: c.primary }
              : { backgroundColor: c.surface, borderColor: c.border },
          ]}
          onPress={() => {
            lightTap();
            onTrendSelect(isTrendActive(t) ? null : toFilter(t));
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, { color: isTrendActive(t) ? c.primary : c.textSecondary }]}>
            {t.label}
          </Text>
        </TouchableOpacity>
      ))}
      <View style={{ width: 8 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
    flexGrow: 0,
  },
  content: {
    paddingLeft: 16,
    paddingRight: 4,
    gap: 6,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
    marginHorizontal: 2,
  },
});
