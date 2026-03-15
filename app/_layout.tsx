import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../components/ToastConfig';
import { themes } from '../constants/theme';

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
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
          headerBackTitle: '',
          contentStyle: { backgroundColor: c.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: ' ' }} />
        <Stack.Screen name="login" options={{ presentation: 'modal' }} />
        <Stack.Screen name="restaurant/[id]" options={{ title: '맛집 상세' }} />
        <Stack.Screen name="my-suggestions" options={{ title: '내 제안 목록' }} />
        <Stack.Screen name="bookmarks" options={{ title: '북마크' }} />
        <Stack.Screen name="legal/terms" options={{ title: '이용약관' }} />
        <Stack.Screen name="legal/privacy" options={{ title: '개인정보 처리방침' }} />
        <Stack.Screen name="notifications/index" options={{ title: '알림', headerBackTitle: ' ' }} />
      </Stack>
      <Toast config={toastConfig} topOffset={60} />
    </GestureHandlerRootView>
  );
}
