import {
  View,
  Text,
  Image,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { themes, typography, spacing } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAppStore } from '../stores/appStore';

const FALLBACK_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/id6760577746',
  android: 'https://play.google.com/store/apps/details?id=com.wishmap.app',
}) || '';

export function ForceUpdateScreen() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const forceUpdate = useAppStore((s) => s.forceUpdate);
  const resolved = mode === 'system' ? systemScheme : mode;
  const c = resolved === 'dark' ? themes.dark : themes.light;

  const storeUrl = forceUpdate?.storeUrl || FALLBACK_STORE_URL;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: c.textPrimary }]}>업데이트가 필요해요</Text>
        <Text style={[styles.desc, { color: c.textSecondary }]}>
          더 나은 사용을 위해{'\n'}최신 버전으로 업데이트해주세요
        </Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: c.primary }]}
          onPress={() => Linking.openURL(storeUrl)}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>스토어로 이동</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xxxl,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  desc: {
    ...typography.body1,
    textAlign: 'center',
  },
  footer: {
    paddingBottom: spacing.xxxl,
  },
  btn: {
    paddingVertical: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    ...typography.body1,
    fontWeight: '600',
    color: '#fff',
  },
});
