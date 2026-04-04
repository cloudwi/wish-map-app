import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
import { themes } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  useEffect(() => {
    useThemeStore.getState().loadMode();
  }, []);

  // 푸시 알림 설정 (네이티브 빌드에서만 동작, 시뮬레이터에서는 no-op)
  useEffect(() => {
    const { setupNotificationHandler, registerForPushNotifications, addNotificationResponseListener } = require('../utils/notifications');
    setupNotificationHandler();

    const { useAuthStore } = require('../stores/authStore');
    const { isAuthenticated } = useAuthStore.getState();
    if (isAuthenticated) {
      registerForPushNotifications();
    }

    const sub = addNotificationResponseListener(() => {
      const { router } = require('expo-router');
      router.push('/notifications');
    });
    return () => sub?.remove?.();
  }, []);

  const resolvedScheme = mode === 'system' ? systemScheme : mode;
  const isDark = resolvedScheme === 'dark';
  const c = isDark ? themes.dark : themes.light;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.headerBg },
          headerTintColor: c.textPrimary,
          headerTitleStyle: { fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="restaurant/[id]" options={{ title: '장소 상세' }} />
        <Stack.Screen name="my-suggestions" options={{ title: '내 제안 목록' }} />
        <Stack.Screen name="bookmarks" options={{ title: '북마크' }} />
        <Stack.Screen name="legal/terms" options={{ title: '이용약관' }} />
        <Stack.Screen name="legal/privacy" options={{ title: '개인정보 처리방침' }} />
        <Stack.Screen name="notifications/index" options={{ title: '알림' }} />
        <Stack.Screen name="friends" options={{ title: '친구' }} />
        <Stack.Screen name="visit-review" options={{ headerShown: false }} />
        <Stack.Screen name="group-manage" options={{ headerShown: false }} />
      </Stack>
      <Toast config={toastConfig} topOffset={60} />
    </GestureHandlerRootView>
  );
}
