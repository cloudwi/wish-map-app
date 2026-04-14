import { View, StyleSheet } from 'react-native';
import Skeleton from './Skeleton';
import { useTheme } from '../hooks/useTheme';

export default function PlaceCardSkeleton() {
  const c = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: c.cardBg }]}>
      <Skeleton width={90} height={90} borderRadius={8} />
      <View style={styles.content}>
        <Skeleton width="60%" height={16} borderRadius={4} />
        <Skeleton width="80%" height={13} borderRadius={4} style={{ marginTop: 8 }} />
        <View style={styles.meta}>
          <Skeleton width={50} height={22} borderRadius={12} />
          <Skeleton width={40} height={14} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    gap: 12,
  },
  content: { flex: 1, justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
});
