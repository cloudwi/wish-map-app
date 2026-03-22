import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant, LikeGroup } from '../types';
import { restaurantApi } from '../api/restaurant';
import { RestaurantCard } from '../components/RestaurantCard';
import RestaurantCardSkeleton from '../components/RestaurantCardSkeleton';
import { useTheme } from '../hooks/useTheme';
import { lightTap } from '../utils/haptics';

export default function CollectionsScreen() {
  const c = useTheme();
  const [groups, setGroups] = useState<LikeGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<LikeGroup | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  useEffect(() => {
    restaurantApi.getCollections()
      .then(data => {
        // 기본 그룹을 항상 첫 번째로
        const sorted = data.sort((a, b) => {
          if (a.name === '기본') return -1;
          if (b.name === '기본') return 1;
          return 0;
        });
        setGroups(sorted);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelectGroup = useCallback(async (group: LikeGroup) => {
    lightTap();
    setSelectedGroup(group);
    setLoadingRestaurants(true);
    try {
      const data = await restaurantApi.getCollectionRestaurants(group.id);
      setRestaurants(data.content);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingRestaurants(false);
    }
  }, []);

  const handleBack = () => {
    lightTap();
    setSelectedGroup(null);
    setRestaurants([]);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={{ paddingTop: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
        </View>
      </View>
    );
  }

  // 컬렉션 내 맛집 목록
  if (selectedGroup) {
    return (
      <>
        <Stack.Screen options={{ title: selectedGroup.name }} />
        <View style={[styles.container, { backgroundColor: c.background }]}>
          <TouchableOpacity style={styles.backRow} onPress={handleBack}>
            <Ionicons name="chevron-back" size={20} color={c.primary} />
            <Text style={[styles.backText, { color: c.primary }]}>컬렉션 목록</Text>
          </TouchableOpacity>

          {loadingRestaurants ? (
            <View style={{ paddingTop: 8 }}>
              {Array.from({ length: 3 }).map((_, i) => <RestaurantCardSkeleton key={i} />)}
            </View>
          ) : (
            <FlatList
              data={restaurants}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item, index }) => <RestaurantCard item={item} index={index} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="restaurant-outline" size={48} color={c.textDisabled} />
                  <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>컬렉션이 비어있습니다</Text>
                  <Text style={[styles.emptyDesc, { color: c.textDisabled }]}>맛집에서 좋아요를 눌러 추가해보세요</Text>
                </View>
              }
            />
          )}
        </View>
      </>
    );
  }

  // 컬렉션 그룹 목록
  return (
    <>
      <Stack.Screen options={{ title: '내 컬렉션' }} />
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <FlatList
          data={groups}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.groupCard, { backgroundColor: c.cardBg, borderColor: c.border }]}
              onPress={() => handleSelectGroup(item)}
              activeOpacity={0.7}
            >
              <View style={styles.groupIcon}>
                <Ionicons name="heart" size={22} color={c.textSecondary} />
              </View>
              <View style={styles.groupContent}>
                <Text style={[styles.groupName, { color: c.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.groupCount, { color: c.textTertiary }]}>{item.restaurantCount}개의 맛집</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textDisabled} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="heart-outline" size={48} color={c.textDisabled} />
              <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>컬렉션이 없습니다</Text>
              <Text style={[styles.emptyDesc, { color: c.textDisabled }]}>맛집에서 좋아요를 눌러 컬렉션에 추가해보세요</Text>
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
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backText: { fontSize: 14, fontWeight: '500' },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
    gap: 14,
    borderWidth: 0.5,
  },
  groupIcon: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupContent: { flex: 1 },
  groupName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  groupCount: { fontSize: 13 },
  empty: { padding: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600' },
  emptyDesc: { fontSize: 13, textAlign: 'center' },
});
