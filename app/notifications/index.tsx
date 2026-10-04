import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, View, Pressable, Platform } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationApi, NotificationResponse } from '../../api/notification';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { Button, Heading, Notice, Page, Panel, ui } from '../../components/ServiceUI';
import { registerForPushNotifications } from '../../utils/notifications';

export default function NotificationsScreen() {
  const c = useTheme();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [more, setMore] = useState(false);
  const page = useRef(0);
  const version = useRef(0);
  const fetching = useRef(false);
  const load = useCallback(async (append = false) => {
    if (!user || fetching.current) { if (!user) setLoading(false); return; }
    const current = ++version.current;
    fetching.current = true; setLoading(true); setError('');
    const next = append ? page.current + 1 : 0;
    try {
      const found = await notificationApi.getNotifications(next, 30);
      if (current !== version.current) return;
      page.current = next; setMore(!found.last);
      setItems((old) => append ? Array.from(new Map([...old, ...found.content].map((n) => [n.id, n])).values()) : found.content);
      if (next === 0) await notificationApi.markAllAsRead();
    } catch (e) { if (current === version.current) setError(getErrorMessage(e)); }
    finally { if (current === version.current) { fetching.current = false; setLoading(false); } }
  }, [user]);
  useFocusEffect(useCallback(() => { fetching.current = false; void load(); return () => { version.current++; fetching.current = false; }; }, [load]));
  return <Page>
    <Stack.Screen options={{ title: '알림' }} />
    <Heading title="모임 소식을 확인해요" subtitle="참가 신청과 승인, 파티 변경 소식을 알려드려요." />
    {!user ? <Button label="로그인하기" onPress={() => router.push('/login')} /> : <>
      {Platform.OS !== 'web' && <Button label="이 기기에서 모임 알림 받기" secondary onPress={() => { void registerForPushNotifications().then((token) => { if (!token) setError('알림 권한을 확인해주세요. 기기 설정에서 위시맵 알림을 허용할 수 있어요.'); }); }} />}
      <Notice message={error} onRetry={() => void load()} />
      {loading && <ActivityIndicator color={c.primary} />}
      {!loading && !error && items.length === 0 && <Panel><Text style={[ui.label, { color: c.textPrimary }]}>아직 새 소식이 없어요</Text><Text style={[ui.body, { color: c.textSecondary }]}>함께할 모임이 생기면 이곳에서 확인할 수 있어요.</Text></Panel>}
      {items.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={item.title} disabled={!item.referenceId}
        onPress={() => { if (item.referenceId) router.push(`/party/${item.referenceId}`); }}>
        <Panel><View style={ui.row}><Ionicons name="notifications-outline" size={21} color={c.primary} /><Text style={[ui.label, { color: c.textPrimary, flex: 1 }]}>{item.title}</Text></View><Text style={[ui.body, { color: c.textSecondary }]}>{item.message}</Text>
          <Text style={[ui.caption, { color: c.textSecondary }]}>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</Text></Panel>
      </Pressable>)}
      {more && <Button label="알림 더 보기" secondary busy={loading} onPress={() => void load(true)} />}
    </>}
  </Page>;
}
