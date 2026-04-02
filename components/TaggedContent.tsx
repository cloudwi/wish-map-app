import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface Props {
  content: string;
  tags?: string[];
}

export function TaggedContent({ content, tags = [] }: Props) {
  const c = useTheme();

  if (tags.length === 0 && !content) return null;

  if (tags.length === 0) {
    return <Text style={[styles.text, { color: c.textPrimary }]} numberOfLines={2}>{content}</Text>;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
        {tags.map((tag, i) => (
          <View key={i} style={[styles.badge, { backgroundColor: c.chipBg }]}>
            <Text style={[styles.badgeText, { color: c.textSecondary }]}>{tag}</Text>
          </View>
        ))}
      </ScrollView>
      {content ? <Text style={[styles.text, { color: c.textPrimary }]} numberOfLines={2}>{content}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});
