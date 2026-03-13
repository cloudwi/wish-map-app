import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Restaurant, MapBounds } from '../../types';
import { restaurantApi } from '../../api/restaurant';
import NaverMap from '../../components/NaverMap';

const INITIAL_BOUNDS: MapBounds = { minLat: 37.4, maxLat: 37.7, minLng: 126.8, maxLng: 127.2 };

export default function MapScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Restaurant | null>(null);

  const fetchRestaurants = useCallback(async (bounds: MapBounds) => {
    try {
      const response = await restaurantApi.getRestaurants(bounds);
      setRestaurants(response.content);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRestaurants(INITIAL_BOUNDS); }, [fetchRestaurants]);

  return (
    <View style={styles.container}>
      <NaverMap
        restaurants={restaurants}
        onMarkerClick={setSelected}
        onBoundsChange={fetchRestaurants}
      />

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      )}

      {selected && (
        <TouchableOpacity
          style={styles.bottomSheet}
          onPress={() => router.push(`/restaurant/${selected.id}`)}
          activeOpacity={0.9}
        >
          <View style={styles.handle} />
          <Text style={styles.name}>{selected.name}</Text>
          <Text style={styles.address}>{selected.address}</Text>
          <View style={styles.meta}>
            {selected.category && <Text style={styles.category}>{selected.category}</Text>}
            <Text style={styles.likes}>❤️ {selected.likeCount}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#ddd',
    borderRadius: 2, alignSelf: 'center', marginBottom: 15,
  },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  address: { fontSize: 14, color: '#666', marginBottom: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  category: {
    backgroundColor: '#f0f0f0', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 12, fontSize: 13, color: '#666',
  },
  likes: { fontSize: 14, color: '#FF6B35' },
  closeBtn: {
    position: 'absolute', top: 15, right: 15,
    width: 30, height: 30, justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { fontSize: 18, color: '#999' },
});
