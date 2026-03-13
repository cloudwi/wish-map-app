import { StyleSheet, View, Text, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { Restaurant } from '../types';
import { restaurantApi } from '../api/restaurant';
import { RestaurantCard } from '../components/RestaurantCard';
import { LoadingScreen } from '../components/LoadingScreen';

export default function BookmarksScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restaurantApi.getBookmarks()
      .then(res => setRestaurants(res.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <Stack.Screen options={{ title: '북마크' }} />
      <View style={styles.container}>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <RestaurantCard item={item} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>북마크한 맛집이 없습니다</Text>
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
  empty: { padding: 60, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#999' },
});
