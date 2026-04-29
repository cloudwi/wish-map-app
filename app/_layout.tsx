import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
import { KeyboardDoneBar } from '../components/KeyboardDoneBar';
import { MaintenanceScreen } from '../components/MaintenanceScreen';
import { ForceUpdateScreen } from '../components/ForceUpdateScreen';
import { themes } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';
import { checkServerHealth } from '../api/health';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5분
      retry: 1,
    },
  },
});

const INIT_TIMEOUT_MS = 5000;

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const isReady = useAppStore((s) => s.isReady);
  const isMaintenance = useAppStore((s) => s.isMaintenance);
  const forceUpdate = useAppStore((s) => s.forceUpdate);

  // 앱 초기화: 테마 로드 + 인증 확인 + 서버 헬스체크. 최대 5초 대기 후 스플래시 해제.
  useEffect(() => {
    (async () => {
      try {
        await Promise.race([
          Promise.all([
            useThemeStore.getState().loadMode(),
            useAuthStore.getState().checkAuth(),
            checkServerHealth().then((up) => {
              if (!up) useAppStore.getState().setMaintenance(true);
            }),
          ]),
          new Promise((r) => setTimeout(r, INIT_TIMEOUT_MS)),
        ]);
      } catch (e) {
        console.warn('[APP] 초기화 실패', e);
      } finally {
        useAppStore.getState().setReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);

  // 푸시 알림 — 초기화 완료 + 정상 모드에서만 설정
  useEffect(() => {
    if (!isReady || isMaintenance) return;
    const {
      setupNotificationHandler,
      registerForPushNotifications,
      addNotificationResponseListener,
    } = require('../utils/notifications');
    setupNotificationHandler();

    if (useAuthStore.getState().isAuthenticated) {
      registerForPushNotifications();
    }

    const sub = addNotificationResponseListener((response: any) => {
      const { router } = require('expo-router');
      const data = response?.notification?.request?.content?.data;
      if (data?.type === 'LUNCH_VOTE_CREATED' || data?.type === 'LUNCH_VOTE_CLOSED') {
        router.push({ pathname: '/lunch-vote', params: { groupId: data.referenceId } });
      } else {
        router.push('/notifications');
      }
    });
    return () => sub?.remove?.();
  }, [isReady, isMaintenance]);

  const resolvedScheme = mode === 'system' ? systemScheme : mode;
  const isDark = resolvedScheme === 'dark';
  const c = isDark ? themes.dark : themes.light;

  if (!isReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
        {forceUpdate ? (
          <ForceUpdateScreen />
        ) : isMaintenance ? (
          <MaintenanceScreen />
        ) : (
          <>
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
              <Stack.Screen name="place/[id]" options={{ title: '장소 상세' }} />
              <Stack.Screen name="my-suggestions" options={{ title: '내 제안 목록' }} />
              <Stack.Screen name="legal/terms" options={{ title: '이용약관' }} />
              <Stack.Screen name="legal/privacy" options={{ title: '개인정보 처리방침' }} />
              <Stack.Screen name="notifications/index" options={{ title: '알림' }} />
              <Stack.Screen name="friends" options={{ title: '친구' }} />
              <Stack.Screen name="visit-review" options={{ title: '방문 인증' }} />
              <Stack.Screen name="group-manage" options={{ headerShown: false }} />
              <Stack.Screen name="lunch-vote" options={{ title: '점심 투표' }} />
              <Stack.Screen name="tutorial" options={{ presentation: 'fullScreenModal', headerShown: false }} />
            </Stack>
            <KeyboardDoneBar />
          </>
        )}
        <Toast
          config={toastConfig}
          topOffset={60}
          autoHide
          visibilityTime={2000}
          position="bottom"
          bottomOffset={100}
          swipeable={false}
        />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
