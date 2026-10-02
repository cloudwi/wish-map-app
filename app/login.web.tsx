import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router, Stack } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { getErrorMessage } from '../utils/getErrorMessage';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: { theme: string; size: string; width: number }) => void;
        };
      };
    };
  }
}

const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export default function WebLoginScreen() {
  const c = useTheme();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const loginRef = useRef(login);
  loginRef.current = login;

  useEffect(() => {
    if (!clientId) { setError('웹 로그인 설정이 필요합니다.'); return; }
    const render = () => {
      const target = document.getElementById('google-login-button');
      if (!target || !window.google) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: async ({ credential }) => {
        try { setBusy(true); setError(''); await loginRef.current('GOOGLE', credential); router.replace('/(tabs)'); }
        catch (e) { setError(getErrorMessage(e, 'Google 로그인에 실패했습니다.')); }
        finally { setBusy(false); }
      } });
      window.google.accounts.id.renderButton(target, { theme: 'outline', size: 'large', width: 300 });
    };
    if (window.google) { render(); return; }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = render;
    script.onerror = () => setError('Google 로그인 화면을 불러오지 못했습니다.');
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, []);

  return <View style={[styles.page, { backgroundColor: c.background }]}>
    <Stack.Screen options={{ title: '로그인' }} />
    <Text style={[styles.heading, { color: c.textPrimary }]}>위시맵에 오신 걸 환영해요</Text>
    <Text style={{ color: c.textSecondary, marginBottom: 30 }}>파티를 둘러보거나 로그인해서 함께해 보세요.</Text>
    <View nativeID="google-login-button" style={{ minHeight: 44, opacity: busy ? 0.5 : 1 }} />
    {error ? <Text style={{ color: c.error, marginTop: 15 }}>{error}</Text> : null}
    <Pressable onPress={() => router.replace('/(tabs)')} style={{ marginTop: 30 }}>
      <Text style={{ color: c.primary }}>로그인 없이 둘러보기</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
});
