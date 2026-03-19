import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const KNOWN_TAGS: { label: string; color: string }[] = [
  { label: '또 갈 집', color: '#FF6B35' },
  { label: '숨은 맛집', color: '#8B5CF6' },
  { label: '점심 맛집', color: '#F59E0B' },
  { label: '회식 추천', color: '#EF4444' },
  { label: '혼밥 성지', color: '#6366F1' },
  { label: '줄 서는 집', color: '#EC4899' },
  { label: '가성비 갑', color: '#10B981' },
  { label: '뷰 맛집', color: '#0EA5E9' },
];

interface Props {
  content: string;
}

export function TaggedContent({ content }: Props) {
  const c = useTheme();

  // 알려진 태그를 content에서 찾기
  const foundTags: { label: string; color: string }[] = [];
  let remaining = content;

  for (const tag of KNOWN_TAGS) {
    const pattern = `#${tag.label}`;
    if (remaining.includes(pattern)) {
      foundTags.push(tag);
      remaining = remaining.replace(pattern, '');
    }
  }

  // 남은 # 태그도 처리 (알려지지 않은 태그)
  const unknownTagRegex = /#([^\s#]+)/g;
  let match;
  while ((match = unknownTagRegex.exec(remaining)) !== null) {
    foundTags.push({ label: match[1], color: '#6B7280' });
    remaining = remaining.replace(match[0], '');
  }

  const text = remaining.trim();

  if (foundTags.length === 0) {
    return <Text style={[styles.text, { color: c.textPrimary }]}>{content}</Text>;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
        {foundTags.map((tag, i) => (
          <View key={i} style={[styles.badge, { backgroundColor: tag.color + '20' }]}>
            <Text style={[styles.badgeText, { color: tag.color }]}>{tag.label}</Text>
          </View>
        ))}
      </ScrollView>
      {text ? <Text style={[styles.text, { color: c.textPrimary }]} numberOfLines={2}>{text}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});
