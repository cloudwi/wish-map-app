import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Restaurant } from '../types';
import { lightTap } from '../utils/haptics';

interface Props {
  item: Restaurant;
  badge?: React.ReactNode;
  index?: number;
}

export function RestaurantCard({ item, badge, index = 0 }: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 60).duration(300).springify()}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => { lightTap(); router.push(`/restaurant/${item.id}`); }}
        activeOpacity={0.8}
      >
        {item.thumbnailImage ? (
          <Image source={{ uri: item.thumbnailImage }} style={styles.thumbnail} />
        ) : (
          <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
            <Ionicons name="restaurant-outline" size={26} color="#d4c4bc" />
          </View>
        )}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {badge}
          </View>
          <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
          <View style={styles.meta}>
            {item.category && (
              <Text style={styles.category}>{item.category}</Text>
            )}
            <Text style={styles.likes}>❤️ {item.likeCount}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
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
    width: 90,
    height: 90,
    backgroundColor: '#FFF5F0',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
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
});
