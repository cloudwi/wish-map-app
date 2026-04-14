import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';

import { useState, useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../types';
import { placeApi } from '../api/place';
import { PlaceCard } from '../components/PlaceCard';
import PlaceCardSkeleton from '../components/PlaceCardSkeleton';
import { useTheme } from '../hooks/useTheme';


export default function MySuggestionsScreen() {
  const c = useTheme();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    placeApi.getMyPlaces()
      .then(res => setPlaces(res.content))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={{ paddingTop: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <PlaceCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '내가 방문한 장소' }} />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <FlatList
          data={places}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => (
            <PlaceCard
              item={item}
              index={index}
            />
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
