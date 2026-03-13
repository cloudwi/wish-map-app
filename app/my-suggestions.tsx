import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { Restaurant } from '../types';
import { restaurantApi } from '../api/restaurant';

const STATUS_LABELS = {
  PENDING: { text: '승인 대기', color: '#FFA500' },
  APPROVED: { text: '승인됨', color: '#4CAF50' },
  REJECTED: { text: '거절됨', color: '#F44336' },
};

export default function MySuggestionsScreen() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMySuggestions = async () => {
    try {
      const response = await restaurantApi.getMyRestaurants();
      setRestaurants(response.content);
    } catch (error) {
      console.error('Failed to fetch my suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMySuggestions();
  }, []);

  const renderItem = ({ item }: { item: Restaurant }) => {
    const status = STATUS_LABELS[item.status];
    
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => router.push(`/restaurant/${item.id}`)}
      >
        <Image 
          source={{ uri: item.thumbnailImage || 'https://via.placeholder.com/80' }}
          style={styles.thumbnail}
        />
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
              <Text style={styles.statusText}>{status.text}</Text>
            </View>
          </View>
          <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
          {item.category && <Text style={styles.category}>{item.category}</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '내 제안 목록' }} />
      <View style={styles.container}>
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>제안한 맛집이 없습니다</Text>
              <TouchableOpacity 
                style={styles.suggestButton}
                onPress={() => router.push('/(tabs)/suggest')}
              >
                <Text style={styles.suggestButtonText}>맛집 제안하기</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </>
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
  listContent: {
    padding: 15,
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
    width: 80,
    height: 80,
    backgroundColor: '#eee',
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  address: {
    fontSize: 13,
    color: '#888',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#999',
    marginBottom: 20,
  },
  suggestButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  suggestButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
