import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';

const KNOWN_TAGS = [
  '또 갈 집', '숨은 맛집', '점심 맛집', '회식 추천',
  '혼밥 성지', '줄 서는 집', '가성비 갑', '뷰 맛집',
];

interface Props {
  content: string;
}

export function TaggedContent({ content }: Props) {
  const c = useTheme();

  // 알려진 태그를 content에서 찾기
  const foundTags: string[] = [];
  let remaining = content;

  for (const tag of KNOWN_TAGS) {
    const pattern = `#${tag}`;
    if (remaining.includes(pattern)) {
      foundTags.push(tag);
      remaining = remaining.replace(pattern, '');
    }
  }

  // 남은 # 태그도 처리 (알려지지 않은 태그)
  const unknownTagRegex = /#([^\s#]+)/g;
  let match;
  while ((match = unknownTagRegex.exec(remaining)) !== null) {
    foundTags.push(match[1]);
    remaining = remaining.replace(match[0], '');
  }

  const text = remaining.trim();

  if (foundTags.length === 0) {
    return <Text style={[styles.text, { color: c.textPrimary }]} numberOfLines={2}>{content}</Text>;
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
        {foundTags.map((tag, i) => (
          <View key={i} style={[styles.badge, { backgroundColor: c.chipBg }]}>
            <Text style={[styles.badgeText, { color: c.textSecondary }]}>{tag}</Text>
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
