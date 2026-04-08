import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';

import { useState, useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types';
import { restaurantApi } from '../api/restaurant';
import { RestaurantCard } from '../components/RestaurantCard';
import RestaurantCardSkeleton from '../components/RestaurantCardSkeleton';
import { useTheme } from '../hooks/useTheme';


export default function MySuggestionsScreen() {
  const c = useTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restaurantApi.getMyRestaurants()
      .then(res => setRestaurants(res.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={{ paddingTop: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '내가 방문한 장소' }} />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <View>
              <RestaurantCard
                item={item}
                index={index}
              />
              {item.lastVisitedAt && (
                <Text style={[styles.visitDate, { color: c.textTertiary }]}>
                  마지막 방문 {new Date(item.lastVisitedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={48} color={c.textDisabled} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>방문한 장소가 없습니다</Text>
              <TouchableOpacity
                style={styles.suggestBtn}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.suggestBtnText}>지도에서 장소 찾기</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 15 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  empty: { padding: 60, alignItems: 'center', gap: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  suggestBtn: { backgroundColor: '#E8590C', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  suggestBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  visitDate: { fontSize: 12, paddingHorizontal: 16, paddingBottom: 12, marginTop: -4 },
});
