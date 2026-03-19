import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const TAG_COLORS: Record<string, string> = {
  '또 갈 집': '#FF6B35',
  '숨은 맛집': '#8B5CF6',
  '점심 맛집': '#F59E0B',
  '회식 추천': '#EF4444',
  '혼밥 성지': '#6366F1',
  '줄 서는 집': '#EC4899',
  '가성비 갑': '#10B981',
  '뷰 맛집': '#0EA5E9',
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] || '#6B7280';
}

interface Props {
  content: string;
}

export function TaggedContent({ content }: Props) {
  const c = useTheme();

  // #태그 파싱
  const tagRegex = /#([^\s#]+)/g;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }

  // 태그 제거한 텍스트
  const text = content.replace(/#[^\s#]+/g, '').trim();

  if (tags.length === 0) {
    return <Text style={[styles.text, { color: c.textPrimary }]}>{content}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tagRow}>
        {tags.map((tag, i) => (
          <View key={i} style={[styles.badge, { backgroundColor: getTagColor(tag) + '20' }]}>
            <Text style={[styles.badgeText, { color: getTagColor(tag) }]}>{tag}</Text>
          </View>
        ))}
      </View>
      {text ? <Text style={[styles.text, { color: c.textPrimary }]}>{text}</Text> : null}
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
