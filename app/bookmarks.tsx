import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types';
import { restaurantApi } from '../api/restaurant';
import { RestaurantCard } from '../components/RestaurantCard';
import RestaurantCardSkeleton from '../components/RestaurantCardSkeleton';

export default function BookmarksScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restaurantApi.getBookmarks()
      .then(res => setRestaurants(res.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ paddingTop: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '북마크' }} />
      <View style={styles.container}>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => <RestaurantCard item={item} index={index} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="bookmark-outline" size={48} color="#ddd" />
              <Text style={styles.emptyTitle}>북마크한 맛집이 없습니다</Text>
              <Text style={styles.emptyDesc}>마음에 드는 맛집을 북마크해보세요</Text>
            </View>
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  listContent: { padding: 15 },
  empty: { padding: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#999' },
  emptyDesc: { fontSize: 13, color: '#bbb' },
});
