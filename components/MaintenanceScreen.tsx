import { useEffect } from 'react';
import { View, Text, Image, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { themes, typography, spacing } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAppStore } from '../stores/appStore';
import { checkServerHealth } from '../api/health';

const POLL_INTERVAL_MS = 10000;

export function MaintenanceScreen() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const resolved = mode === 'system' ? systemScheme : mode;
  const c = resolved === 'dark' ? themes.dark : themes.light;

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      const up = await checkServerHealth();
      if (!cancelled && up) useAppStore.getState().setMaintenance(false);
    };
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.content}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: c.textPrimary }]}>잠시 점검 중이에요</Text>
        <Text style={[styles.desc, { color: c.textSecondary }]}>곧 다시 돌아올게요</Text>
      </View>
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={c.textTertiary} />
        <Text style={[styles.footerText, { color: c.textTertiary }]}>자동으로 연결 재시도 중</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.xxxl,
  },
  footerText: {
    ...typography.caption1,
  },
});
