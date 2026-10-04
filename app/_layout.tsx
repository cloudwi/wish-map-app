import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
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
import { TermsAgreementModal } from '../components/TermsAgreementModal';
import { setupNotificationHandler, addNotificationResponseListener } from '../utils/notifications';

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasAgreedToTerms = useAuthStore((s) => s.hasAgreedToTerms);
  const isCheckingTerms = useAuthStore((s) => s.isCheckingTerms);

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

  // 푸시 알림 핸들러 + 알림 클릭 리스너 — 초기화 완료 + 정상 모드에서만 1회 설정
  useEffect(() => {
    if (!isReady || isMaintenance || Platform.OS === 'web') return;
    setupNotificationHandler();

    const sub = addNotificationResponseListener(() => {
      router.push('/notifications');
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
              <Stack.Screen name="party/create" options={{ title: '파티 만들기' }} />
              <Stack.Screen name="party/[id]" options={{ title: '파티 상세' }} />
              <Stack.Screen name="report" options={{ title: '신고하기' }} />
              <Stack.Screen name="legal/terms" options={{ title: '이용약관' }} />
              <Stack.Screen name="legal/privacy" options={{ title: '개인정보 처리방침' }} />
              <Stack.Screen name="notifications/index" options={{ title: '알림' }} />
            </Stack>
            <KeyboardDoneBar />
            <TermsAgreementModal visible={isAuthenticated && !isCheckingTerms && !hasAgreedToTerms}
              onAgree={() => useAuthStore.getState().setTermsAgreed()}
              onCancel={() => { void useAuthStore.getState().logout(); }} />
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
