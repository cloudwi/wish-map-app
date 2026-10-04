import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { blockApi, BlockedUserResponse } from '../api/block';
import { useTheme } from '../hooks/useTheme';
import { getErrorMessage } from '../utils/getErrorMessage';
import { confirmAction } from '../utils/confirm';
import { Button, Heading, Notice, Page, Panel, ui } from '../components/ServiceUI';

export default function BlockedUsersScreen() {
  const c = useTheme();
  const [items, setItems] = useState<BlockedUserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const version = useRef(0);
  const load = useCallback(async () => {
    const current = ++version.current; setLoading(true); setError('');
    try { const found = await blockApi.getBlockedUsers(); if (current === version.current) setItems(found); }
    catch (e) { if (current === version.current) setError(getErrorMessage(e)); }
    finally { if (current === version.current) setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); return () => { version.current++; }; }, [load]));
  const unblock = async (item: BlockedUserResponse) => {
    if (busy || !await confirmAction('차단 해제', `${item.nickname}님의 차단을 해제할까요?`)) return;
    setBusy(true); setError('');
    try { await blockApi.unblock(item.userId); setItems((old) => old.filter((u) => u.id !== item.id)); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  };
  return <Page>
    <Stack.Screen options={{ title: '차단 목록' }} /><Heading title="차단한 사용자" subtitle="차단한 주최자의 파티는 목록에 표시되지 않아요." />
    <Notice message={error} onRetry={() => void load()} />
    {loading && <ActivityIndicator color={c.primary} />}
    {!loading && !error && items.length === 0 && <Panel><Text style={[ui.label, { color: c.textPrimary }]}>차단한 사용자가 없어요</Text></Panel>}
    {items.map((item) => <Panel key={item.id}><View style={[ui.row, { justifyContent: 'space-between', flexWrap: 'wrap' }]}>
      <Text style={[ui.label, { color: c.textPrimary }]}>{item.nickname}</Text><Button label="차단 해제" secondary disabled={busy} onPress={() => void unblock(item)} />
    </View></Panel>)}
  </Page>;
}
