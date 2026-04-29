import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { lightTap } from '../utils/haptics';

interface TutorialContentProps {
  onDone: () => void;
}

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  {
    icon: 'map-outline',
    title: '지도에서 둘러보기',
    desc: '동료들이 다녀온 맛집을 한눈에 확인하세요.',
  },
  {
    icon: 'checkmark-circle-outline',
    title: '방문 인증으로 기록',
    desc: '가게에서 GPS 인증 후 가격대·태그·한줄평을 남겨요.',
  },
  {
    icon: 'people-outline',
    title: '그룹으로 공유',
    desc: '팀이나 친구 그룹을 만들어 우리만의 맛집 지도를 쌓아요.',
  },
];

export function TutorialContent({ onDone }: TutorialContentProps) {
  const c = useTheme();

  const handleStart = () => {
    lightTap();
    onDone();
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconBadge, { backgroundColor: c.primaryBg }]}>
          <Ionicons name="sparkles" size={28} color={c.primary} />
        </View>
        <Text style={[styles.title, { color: c.textPrimary }]}>위시맵에 오신 걸 환영해요</Text>
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>
          함께 만드는 우리만의 맛집 지도
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: c.primaryBg }]}>
                <Ionicons name={f.icon} size={20} color={c.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: c.textPrimary }]}>{f.title}</Text>
                <Text style={[styles.featureDesc, { color: c.textSecondary }]}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: c.primary }]}
        onPress={handleStart}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>시작하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80, paddingBottom: 40 },
  content: { flex: 1 },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15, marginBottom: 40 },
  features: { gap: 24 },
  featureRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: { flex: 1, paddingTop: 4 },
  featureTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  featureDesc: { fontSize: 14, lineHeight: 20 },
  button: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
