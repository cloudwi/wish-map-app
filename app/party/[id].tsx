import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { partyApi, Party } from '../../api/party';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { getPartyCategory } from '../../constants/party-options';
import { formatPartyDate } from '../../utils/party-date';
import { openVenueMap } from '../../utils/venue-map';

export default function PartyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useTheme();
  const user = useAuthStore((s) => s.user);
  const [party, setParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const partyId = Number(id);

  const load = useCallback(async () => {
    try { setError(''); setParty(await partyApi.detail(partyId)); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, [partyId]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const run = async (action: () => Promise<Party>) => {
    try { setBusy(true); setError(''); setParty(await action()); await load(); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 50 }} color={c.primary} />;
  if (!party) return <View style={styles.page}><Text>{error || '파티를 찾을 수 없어요'}</Text></View>;
  const mine = party.members.find((m) => m.userId === user?.id);
  const isHost = user?.id === party.hostId;
  const active = party.status === 'OPEN' && new Date(party.startsAt) > new Date();

  return <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.page}>
    <Stack.Screen options={{ title: '파티 상세' }} />
    <Text style={[styles.label, { color: c.primary }]}>{getPartyCategory(party.category).label}</Text>
    <Text style={[styles.title, { color: c.textPrimary }]}>{party.title}</Text>
    <Text style={[styles.meta, { color: c.textSecondary }]}>주최 {party.hostNickname} · {party.participantCount}/{party.capacity}명</Text>
    <Text style={[styles.meta, { color: c.textSecondary }]}>{formatPartyDate(party.startsAt)}</Text>
    <View style={[styles.box, { backgroundColor: c.cardBg, borderColor: c.border }]}>
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{party.venueName}</Text>
      <Text style={{ color: c.textSecondary }}>{party.venueAddress}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="네이버 지도에서 장소 보기"
        onPress={() => { void openVenueMap(party).catch(() => setError('지도를 열지 못했어요. 잠시 후 다시 시도해주세요.')); }}
        style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={[styles.link, { color: c.primary }]}>네이버 지도로 장소 보기 ↗</Text>
      </Pressable>
    </View>
    <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>함께할 내용</Text>
    <Text style={[styles.description, { color: c.textPrimary }]}>{party.description || '주최자가 남긴 설명이 없어요.'}</Text>
    <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>참가자</Text>
    <Text style={[styles.member, { color: c.textSecondary }]}>{party.hostNickname} · 주최자</Text>
    {party.members.filter((m) => m.status === 'APPROVED').map((m) =>
      <Text key={m.id} style={[styles.member, { color: c.textSecondary }]}>{m.nickname}</Text>)}
    {mine?.status === 'PENDING' && <Text style={{ color: c.primary }}>승인을 기다리고 있어요.</Text>}
    {isHost && party.members.filter((m) => m.status === 'PENDING').map((m) =>
      <View key={m.id} style={styles.requestRow}>
        <Text style={{ color: c.textPrimary, flex: 1 }}>{m.nickname}님의 신청</Text>
        <Pressable disabled={busy} onPress={() => run(() => partyApi.decide(partyId, m.id, true))}><Text style={{ color: c.primary }}>승인  </Text></Pressable>
        <Pressable disabled={busy} onPress={() => run(() => partyApi.decide(partyId, m.id, false))}><Text style={{ color: c.error }}>거절</Text></Pressable>
      </View>)}
    {error ? <Text style={{ color: c.error, marginTop: 20 }}>{error}</Text> : null}
    {active && !user && <Action label="로그인하고 참가하기" onPress={() => router.push('/login')} disabled={busy} color={c.primary} />}
    {active && user && !isHost && (!mine || mine.status === 'WITHDRAWN' || mine.status === 'REJECTED') &&
      <Action label={party.participantCount >= party.capacity ? '정원이 가득 찼어요' : '참가 신청'}
        onPress={() => run(() => partyApi.join(partyId))} disabled={busy || party.participantCount >= party.capacity} color={c.primary} />}
    {active && (mine?.status === 'PENDING' || mine?.status === 'APPROVED') &&
      <Action label="신청 취소" onPress={() => run(() => partyApi.withdraw(partyId))} disabled={busy} color={c.error} />}
    {isHost && party.status === 'OPEN' && <Action label="파티 취소" onPress={() => run(() => partyApi.cancel(partyId))} disabled={busy} color={c.error} />}
    {user && !isHost && <Pressable style={{ marginTop: 30, alignSelf: 'center' }}
      onPress={() => router.push({ pathname: '/report', params: { targetType: 'PARTY', targetId: partyId } })}>
      <Text style={{ color: c.textSecondary }}>이 파티 신고하기</Text>
    </Pressable>}
  </ScrollView>;
}

function Action({ label, onPress, disabled, color }: { label: string; onPress: () => void; disabled: boolean; color: string }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.button, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}>
    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page: { padding: 22, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '700', marginBottom: 10 },
  meta: { fontSize: 14, marginBottom: 6 },
  box: { borderWidth: 1, borderRadius: 16, padding: 18, marginVertical: 22, gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  description: { fontSize: 15, lineHeight: 24 },
  link: { marginTop: 8, fontWeight: '600' },
  member: { paddingVertical: 5 },
  requestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  button: { marginTop: 22, minHeight: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
