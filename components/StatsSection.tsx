import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { placeApi } from '../api/place';
import { useTheme } from '../hooks/useTheme';
import { lightTap } from '../utils/haptics';

export function StatsSection() {
  const c = useTheme();
  const [weeklyTop, setWeeklyTop] = useState<any[]>([]);

  useEffect(() => {
    placeApi.getWeeklyTop().then(setWeeklyTop).catch(() => {});
  }, []);

  if (weeklyTop.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Ionicons name="flame" size={18} color="#FF6B35" />
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>최근 HOT</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardRow}>
        {weeklyTop.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.rankCard, { backgroundColor: c.cardBg, borderColor: c.border }]}
            onPress={() => { lightTap(); router.push(`/place/${item.id}`); }}
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
            <Text style={[styles.rankMeta, { color: c.primary }]}>최근 {item.visitCount}회 방문</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 8, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginBottom: 10 },
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
});
