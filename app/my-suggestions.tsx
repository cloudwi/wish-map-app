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
      <Stack.Screen options={{ title: '내 제안 목록' }} />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <RestaurantCard
              item={item}
              index={index}
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="restaurant-outline" size={48} color={c.textDisabled} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>제안한 맛집이 없습니다</Text>
              <TouchableOpacity
                style={styles.suggestBtn}
                onPress={() => router.push('/(tabs)/suggest')}
              >
                <Text style={styles.suggestBtnText}>맛집 제안하기</Text>
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
  suggestBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  suggestBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
