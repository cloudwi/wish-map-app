import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Share, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Party, partyApi } from '../../api/party';
import { blockApi } from '../../api/block';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { getPartyCategory } from '../../constants/party-options';
import { formatPartyDate } from '../../utils/party-date';
import { openVenueMap } from '../../utils/venue-map';
import { confirmAction } from '../../utils/confirm';
import { Button, Heading, Notice, Page, Panel, ui } from '../../components/ServiceUI';

export default function PartyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const user = useAuthStore((s) => s.user);
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const partyId = Number(id);
  const version = useRef(0);
  const inFlight = useRef(false);
  const focused = useRef(false);

  const load = useCallback(async () => {
    const current = ++version.current;
    setLoading(true); setError('');
    if (!Number.isSafeInteger(partyId) || partyId <= 0) { setParty(null); setError('올바른 파티 주소인지 확인해주세요.'); setLoading(false); return; }
    try { const found = await partyApi.detail(partyId); if (current === version.current) setParty(found); }
    catch (e) { if (current === version.current) { setParty(null); setError(getErrorMessage(e)); } }
    finally { if (current === version.current) setLoading(false); }
  }, [partyId]);
  useFocusEffect(useCallback(() => {
    focused.current = true; void load();
    return () => { focused.current = false; version.current++; };
  }, [load]));

  const run = async (action: () => Promise<Party>, success: string) => {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError(''); setFeedback('');
    try {
      const result = await action();
      if (focused.current) { setParty(result); setFeedback(success); }
    } catch (e) { if (focused.current) setError(getErrorMessage(e)); }
    finally { inFlight.current = false; if (focused.current) setBusy(false); }
  };

  if (loading && !party) return <Page><ActivityIndicator color={c.primary} /><Text style={{ color: c.textSecondary }}>파티를 불러오고 있어요</Text></Page>;
  if (!party) return <Page><Heading title="파티를 확인할 수 없어요" /><Notice message={error} onRetry={() => void load()} /><Button label="파티 목록으로" onPress={() => router.replace('/(tabs)')} secondary /></Page>;
  const mine = party.members.find((m) => m.userId === user?.id)?.status || party.myStatus;
  const isHost = user?.id === party.hostId;
  const active = party.status === 'OPEN' && new Date(party.startsAt) > new Date();
  const remaining = Math.max(0, party.capacity - party.participantCount);
  const approved = party.members.filter((m) => m.status === 'APPROVED');
  const pending = party.members.filter((m) => m.status === 'PENDING');
  const status = party.status === 'CANCELLED' ? '취소된 파티예요' : !active ? '시작 시간이 지난 파티예요' : mine === 'PENDING' ? '주최자의 승인을 기다리고 있어요' : mine === 'APPROVED' ? '참가가 확정됐어요' : remaining ? `${remaining}자리가 남았어요` : '정원이 모두 찼어요';

  return <Page>
    <Stack.Screen options={{ title: '파티 상세' }} />
    <View style={ui.row}><Ionicons name={getPartyCategory(party.category).icon} size={21} color={c.primary} /><Text style={{ color: c.primary, fontWeight: '700' }}>{getPartyCategory(party.category).label}</Text></View>
    <Heading title={party.title} subtitle={`주최 ${party.hostNickname}`} />
    <View style={{ borderRadius: 14, padding: 15, backgroundColor: active ? c.primaryBg : c.surfaceSecondary }}><Text accessibilityLiveRegion="polite" style={{ color: active ? c.primary : c.textSecondary, fontWeight: '600' }}>{status}</Text></View>
    <Panel>
      <View style={ui.row}><Ionicons name="time-outline" size={21} color={c.primary} /><Text style={[ui.label, { color: c.textPrimary, flex: 1 }]}>{formatPartyDate(party.startsAt)}</Text></View>
      <View style={ui.row}><Ionicons name="location-outline" size={21} color={c.primary} /><Text style={[ui.label, { color: c.textPrimary, flex: 1 }]}>{party.venueName}</Text></View>
      <Text style={[ui.body, { color: c.textSecondary }]}>{party.venueAddress}</Text>
      <Button label="네이버 지도로 장소 보기 ↗" accessibilityLabel="네이버 지도에서 장소 보기" secondary onPress={() => { void openVenueMap(party).catch(() => setError('지도를 열지 못했어요. 다시 시도해주세요.')); }} />
    </Panel>
    <Panel><Text style={[ui.label, { color: c.textPrimary }]}>함께할 내용</Text><Text style={[ui.body, { color: c.textSecondary }]}>{party.description || '주최자가 남긴 설명이 없어요.'}</Text></Panel>
    <Panel>
      <Text style={[ui.label, { color: c.textPrimary }]}>함께하는 사람 · {party.participantCount}/{party.capacity}명</Text>
      <View style={ui.row}><Ionicons name="person-circle-outline" size={27} color={c.primary} /><Text style={{ color: c.textPrimary, flex: 1 }}>{party.hostNickname}</Text><Text style={{ color: c.primary, fontSize: 12 }}>주최자</Text></View>
      {approved.map((m) => <View key={m.id} style={ui.row}><Ionicons name="person-circle-outline" size={27} color={c.textSecondary} /><Text style={{ color: c.textPrimary }}>{m.nickname}</Text></View>)}
      {active && <Text style={[ui.caption, { color: c.textSecondary }]}>참가 신청은 주최자가 승인한 후 확정돼요.</Text>}
    </Panel>
    {isHost && active && pending.length > 0 && <Panel>
      <Text style={[ui.label, { color: c.textPrimary }]}>참가 신청 · {pending.length}명</Text>
      {pending.map((m) => <View key={m.id} style={{ gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderColor: c.border }}>
        <Text style={[ui.body, { color: c.textPrimary }]}>{m.nickname}님의 신청</Text>
        <View style={[ui.row, { flexWrap: 'wrap' }]}>
          <Button label="승인" accessibilityLabel={`${m.nickname} 참가 승인`} disabled={busy || remaining === 0} onPress={() => void run(() => partyApi.decide(partyId, m.id, true), `${m.nickname}님의 참가를 승인했어요.`)} />
          <Button label="거절" accessibilityLabel={`${m.nickname} 참가 거절`} secondary disabled={busy} onPress={() => { void (async () => { if (await confirmAction('참가 신청 거절', `${m.nickname}님의 신청을 거절할까요?`)) await run(() => partyApi.decide(partyId, m.id, false), '참가 신청을 거절했어요.'); })(); }} />
        </View>
      </View>)}
      {remaining === 0 && <Text style={[ui.caption, { color: c.textSecondary }]}>정원이 가득 차 추가 승인할 수 없어요.</Text>}
    </Panel>}
    <Notice message={error} />
    {!!feedback && <Text accessibilityLiveRegion="polite" style={[ui.body, { color: c.success }]}>{feedback}</Text>}
    {active && !isHost && (!user || !mine || mine === 'REJECTED' || mine === 'WITHDRAWN') &&
      <Button label={!remaining ? '정원이 가득 찼어요' : user ? '참가 신청하기' : '로그인하고 참가하기'} disabled={busy || !remaining} busy={busy}
        onPress={() => user ? void run(() => partyApi.join(partyId), '신청을 보냈어요. 주최자가 승인하면 참가가 확정돼요.') : router.push({ pathname: '/login', params: { redirect: `/party/${partyId}` } })} />}
    {active && (mine === 'PENDING' || mine === 'APPROVED') && <Button label="참가 신청 취소" secondary disabled={busy} onPress={() => { void (async () => {
      if (await confirmAction('참가 취소', '이 파티의 참가 신청을 취소할까요?', '신청 취소', true)) await run(() => partyApi.withdraw(partyId), '참가 신청을 취소했어요.');
    })(); }} />}
    {isHost && party.status === 'OPEN' && <Button label="파티 취소" destructive secondary disabled={busy} onPress={() => { void (async () => {
      if (await confirmAction('파티 취소', '모든 신청자에게 취소 알림이 전달돼요. 파티를 취소할까요?', '파티 취소', true)) await run(() => partyApi.cancel(partyId), '파티를 취소했어요.');
    })(); }} />}
    <Button label="파티 공유하기" secondary onPress={() => { void Share.share({ message: `${party.title}\n${formatPartyDate(party.startsAt)}\n${party.venueName}\n${party.venueAddress}${process.env.EXPO_PUBLIC_WEB_URL ? `\n${process.env.EXPO_PUBLIC_WEB_URL}/party/${partyId}` : ''}` }).catch(() => setError('공유 화면을 열지 못했어요.')); }} />
    {user && !isHost && <View style={{ gap: 10 }}>
      <Button label="이 파티 신고하기" secondary onPress={() => router.push({ pathname: '/report', params: { targetType: 'PARTY', targetId: partyId } })} />
      {party.hostId && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { void (async () => {
        if (!await confirmAction('주최자 차단', '이 주최자의 파티를 숨기고 서로 참가하지 않도록 할까요?', '차단', true)) return;
        try { await blockApi.block(party.hostId!); router.replace('/(tabs)'); } catch (e) { setError(getErrorMessage(e)); }
      })(); }} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: c.textSecondary }}>주최자 차단하기</Text></Pressable>}
    </View>}
  </Page>;
}
