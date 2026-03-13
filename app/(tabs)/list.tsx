import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { Restaurant } from '../../types';
import { restaurantApi } from '../../api/restaurant';

const CATEGORIES = ['전체', '한식', '중식', '일식', '양식', '카페', '술집', '기타'];

export default function ListScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchRestaurants = async (pageNum = 0, refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else if (pageNum === 0) setLoading(true);

      // 전체 한국 범위로 조회
      const response = await restaurantApi.getRestaurants({
        minLat: 33,
        maxLat: 38.5,
        minLng: 124,
        maxLng: 132,
      }, pageNum, 20);

      const newRestaurants = response.content;
      
      if (pageNum === 0) {
        setRestaurants(newRestaurants);
      } else {
        setRestaurants(prev => [...prev, ...newRestaurants]);
      }
      
      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRestaurants(0);
  }, []);

  const onRefresh = useCallback(() => {
    fetchRestaurants(0, true);
  }, []);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchRestaurants(page + 1);
    }
  };

  const filteredRestaurants = selectedCategory === '전체'
    ? restaurants
    : restaurants.filter(r => r.category === selectedCategory);

  const renderItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/restaurant/${item.id}`)}
      activeOpacity={0.8}
    >
      <Image 
        source={{ uri: item.thumbnailImage || 'https://via.placeholder.com/100' }}
        style={styles.thumbnail}
      />
      <View style={styles.cardContent}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
        <View style={styles.meta}>
          {item.category && (
            <Text style={styles.category}>{item.category}</Text>
          )}
          <Text style={styles.likes}>❤️ {item.likeCount}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && restaurants.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 카테고리 필터 */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        contentContainerStyle={styles.categoryContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === item && styles.categoryButtonTextActive
            ]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* 맛집 목록 */}
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6B35']} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>등록된 맛집이 없습니다</Text>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <ActivityIndicator style={styles.footer} color="#FF6B35" />
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryList: {
    backgroundColor: '#fff',
    maxHeight: 50,
  },
  categoryContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContent: {
    padding: 15,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnail: {
    width: 100,
    height: 100,
    backgroundColor: '#eee',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 12,
    color: '#666',
  },
  likes: {
    fontSize: 13,
    color: '#FF6B35',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
  },
  footer: {
    paddingVertical: 20,
  },
});
