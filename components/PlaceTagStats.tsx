import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { TagStat } from '../types';

interface Props {
  stats: TagStat[];
}

export function PlaceTagStats({ stats }: Props) {
  const c = useTheme();

  if (!stats || stats.length === 0) return null;

  return (
    <View style={[styles.section, { borderBottomColor: c.background }]}>
      <Text style={[styles.title, { color: c.textPrimary }]}>이 곳에서 많이 언급돼요</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {stats.map((s, i) => (
          <View key={`${s.tag}-${i}`} style={[styles.chip, { backgroundColor: c.chipBg }]}>
            <Text style={[styles.chipTag, { color: c.textSecondary }]}>#{s.tag}</Text>
            <Text style={[styles.chipCount, { color: c.textTertiary }]}>{s.count}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 16,
    borderBottomWidth: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipTag: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipCount: {
    fontSize: 11,
    fontWeight: '500',
  },
});
