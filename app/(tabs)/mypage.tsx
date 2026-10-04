import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { authApi } from '../../api/auth';
import { Party, partyApi } from '../../api/party';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { confirmAction } from '../../utils/confirm';
import { Button, Field, Heading, Notice, Page, Panel, ui } from '../../components/ServiceUI';
import { PartyCard } from '../../components/PartyCard';

const statusLabels: Record<string, string> = { HOST: '내가 연 파티', PENDING: '승인 대기', APPROVED: '참가 확정', REJECTED: '신청 거절', WITHDRAWN: '신청 취소' };

export default function MyPageScreen() {
  const c = useTheme();
  const { user, logout, updateNickname } = useAuthStore();
  const [items, setItems] = useState<Party[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [nickname, setNickname] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const version = useRef(0);
  const pageNumber = useRef(0);
  const fetching = useRef(false);
  const load = useCallback(async (more = false) => {
    if (!user || fetching.current) return;
    const current = ++version.current;
    const page = more ? pageNumber.current + 1 : 0;
    fetching.current = true; setLoading(true); setError('');
    try {
      const found = await partyApi.mine(page);
      if (version.current !== current) return;
      pageNumber.current = page; setHasMore(found.length === 50);
      setItems((old) => more ? Array.from(new Map([...old, ...found].map((p) => [p.id, p])).values()) : found);
    } catch (e) { if (version.current === current) setError(getErrorMessage(e)); }
    finally { if (version.current === current) { fetching.current = false; setLoading(false); } }
  }, [user]);
  useFocusEffect(useCallback(() => {
    fetching.current = false; void load();
    return () => { version.current++; fetching.current = false; };
  }, [load]));

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const visible = items.filter((p) => filter === 'ALL' || (filter === 'HOST' ? p.myStatus === 'HOST' : p.myStatus !== 'HOST'));
  return <Page>
    <Heading title="나의 위시맵" subtitle={user ? '함께할 모임과 내 활동을 한곳에서 관리해요.' : '로그인하고 나만의 모임을 시작해보세요.'} />
    {user ? <>
      <Panel>
        <View style={ui.row}><View style={{ backgroundColor: c.primaryBg, borderRadius: 20, padding: 14 }}><Ionicons name="person-outline" size={28} color={c.primary} /></View>
          <View style={{ flex: 1, gap: 5 }}><Text style={[ui.label, { color: c.textPrimary }]}>{user.nickname}</Text><Text style={[ui.caption, { color: c.textSecondary }]}>오늘도 좋은 만남을 만들어봐요</Text></View></View>
        {editing ? <><Field label="닉네임" value={nickname} onChangeText={setNickname} maxLength={10} hint="2~10자로 입력해주세요." />
          <Button label="닉네임 저장" busy={busy} onPress={() => void run(async () => { if (nickname.trim().length < 2) throw new Error('닉네임은 두 글자 이상 입력해주세요.'); await updateNickname(nickname.trim()); setEditing(false); })} />
          <Button label="편집 취소" secondary onPress={() => setEditing(false)} /></> : <Button label="프로필 편집" secondary onPress={() => { setNickname(user.nickname); setEditing(true); }} />}
      </Panel>
      <View style={[ui.row, { flexWrap: 'wrap' }]}>{[{ id: 'ALL', label: '내 파티 전체' }, { id: 'HOST', label: '내가 연 파티' }, { id: 'JOINED', label: '신청한 파티' }].map((tab) =>
        <Pressable key={tab.id} accessibilityRole="button" accessibilityLabel={tab.label} accessibilityState={{ selected: filter === tab.id }} onPress={() => setFilter(tab.id)}
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 22, backgroundColor: filter === tab.id ? c.primaryBg : c.cardBg }}>
          <Text style={{ color: filter === tab.id ? c.primary : c.textSecondary, fontWeight: '600' }}>{tab.label}</Text>
        </Pressable>)}</View>
      {loading && <ActivityIndicator color={c.primary} />}
      {visible.map((party) => <PartyCard key={party.id} party={party} statusLabel={statusLabels[party.myStatus || '']} onPress={() => router.push(`/party/${party.id}`)} />)}
      {!loading && !error && visible.length === 0 && <Panel><Text style={[ui.label, { color: c.textPrimary }]}>아직 함께할 파티가 없어요</Text>
        <Text style={[ui.body, { color: c.textSecondary }]}>마음에 드는 모임을 찾거나 직접 파티를 열어보세요.</Text><Button label="파티 둘러보기" onPress={() => router.push('/(tabs)')} secondary /></Panel>}
      {hasMore && <Button label="내 파티 더 보기" onPress={() => void load(true)} busy={loading} secondary />}
    </> : <Panel><Text style={[ui.label, { color: c.textPrimary }]}>함께할 사람을 만나보세요</Text><Text style={[ui.body, { color: c.textSecondary }]}>파티 생성·참가와 승인 상태 확인은 로그인 후 이용할 수 있어요.</Text><Button label="휴대폰 번호로 시작하기" onPress={() => router.push('/login')} /></Panel>}
    <Notice message={error} onRetry={user && !busy ? () => void load() : undefined} />
    <Panel>
      {user && <><Menu label="알림" icon="notifications-outline" onPress={() => router.push('/notifications')} /><Menu label="차단 목록" icon="shield-checkmark-outline" onPress={() => router.push('/blocked-users')} /></>}
      <Menu label="이용약관" icon="document-text-outline" onPress={() => router.push('/legal/terms')} />
      <Menu label="개인정보처리방침" icon="lock-closed-outline" onPress={() => router.push('/legal/privacy')} />
      {user && <><Button label="로그아웃" secondary disabled={busy} onPress={() => void run(async () => { if (await confirmAction('로그아웃', '이 기기에서 로그아웃할까요?')) { await logout(); router.replace('/(tabs)'); } })} />
        <Button label="계정 탈퇴" destructive secondary disabled={busy} onPress={() => void run(async () => {
          if (!await confirmAction('계정 탈퇴', '계정과 모임 활동이 삭제되며 복구할 수 없어요. 탈퇴할까요?', '탈퇴하기', true)) return;
          await authApi.deleteAccount(); await logout(); router.replace('/(tabs)');
        })} /></>}
    </Panel>
    <Text style={[ui.caption, { color: c.textSecondary, textAlign: 'center' }]}>wish map · {Constants.expoConfig?.version}</Text>
  </Page>;
}

function Menu({ label, icon, onPress }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void }) {
  const c = useTheme();
  return <Pressable accessibilityRole="button" onPress={onPress} style={[ui.row, { minHeight: 48 }]}>
    <Ionicons name={icon} size={21} color={c.textSecondary} /><Text style={{ flex: 1, fontSize: 15, color: c.textPrimary }}>{label}</Text><Ionicons name="chevron-forward" size={17} color={c.textSecondary} />
  </Pressable>;
}
