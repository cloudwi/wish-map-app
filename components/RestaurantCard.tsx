import { useState, useEffect, memo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Restaurant, PlaceCategory } from '../types';
import { searchPlaceImage } from '../api/search';
import { useTheme } from '../hooks/useTheme';
import { lightTap } from '../utils/haptics';
import { CategoryPlaceholder } from './CategoryPlaceholder';

interface Props {
  item: Restaurant;
  badge?: React.ReactNode;
  index?: number;
  placeCategories?: PlaceCategory[];
}

export const RestaurantCard = memo(function RestaurantCard({ item, badge, index = 0, placeCategories }: Props) {
  const c = useTheme();
  const [imageUri, setImageUri] = useState<string | null>(item.thumbnailImage);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!item.thumbnailImage) {
      searchPlaceImage(item.name).then(setImageUri);
    }
  }, [item.name, item.thumbnailImage]);

  const showPlaceholder = !imageUri || imageError;

  return (
    <View>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.border }]}
        onPress={() => { lightTap(); router.push(`/restaurant/${item.id}`); }}
        activeOpacity={0.8}
      >
        {showPlaceholder ? (
          <CategoryPlaceholder
            icon={placeCategories?.find(cat => cat.id === item.placeCategoryId)?.icon}
            size={90}
          />
        ) : (
          <Image
            source={{ uri: imageUri }}
            style={[styles.thumbnail, { backgroundColor: c.imagePlaceholderBg }]}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            onError={() => setImageError(true)}
          />
        )}
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
            {badge}
          </View>
          <View style={styles.meta}>
            {item.category && (
              <Text style={[styles.category, { backgroundColor: c.categoryBadgeBg, color: c.categoryBadgeText }]}>{item.category}</Text>
            )}
            <Text style={[styles.likes, { color: c.primary }]}>방문 {item.visitCount}회</Text>
          </View>
          {item.lastVisitedAt && (
            <Text style={[styles.visitDate, { color: c.textTertiary }]}>
              최근 방문 {new Date(item.lastVisitedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} {new Date(item.lastVisitedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}, (prev, next) =>
  prev.item.id === next.item.id &&
  prev.item.visitCount === next.item.visitCount &&
  prev.item.lastVisitedAt === next.item.lastVisitedAt &&
  prev.badge === next.badge &&
  prev.placeCategories === next.placeCategories
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 0.5,
  },
  thumbnail: {
    width: 90,
    height: 90,
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
    marginBottom: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 12,
  },
  likes: {
    fontSize: 13,
  },
  visitDate: {
    fontSize: 11,
    marginTop: 6,
  },
});
