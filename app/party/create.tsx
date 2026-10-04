import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { partyApi } from '../../api/party';
import { PlaceResult, searchPlaces } from '../../api/search';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { PARTY_CATEGORIES } from '../../constants/party-options';
import { localDate, parsePartyStart } from '../../utils/party-form';
import { Button, Field, Heading, Notice, Page, Panel, ui } from '../../components/ServiceUI';
import { PartySchedulePicker } from '../../components/PartySchedulePicker';

export default function CreatePartyScreen() {
  const c = useTheme();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MEAL');
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [date, setDate] = useState(localDate(1));
  const [time, setTime] = useState('19:00');
  const [capacity, setCapacity] = useState(4);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [searchError, setSearchError] = useState('');
  const searchVersion = useRef(0);
  const submitting = useRef(false);

  const search = async () => {
    if (query.trim().length < 2) return setSearchError('장소 이름이나 동네를 두 글자 이상 입력해주세요.');
    const version = ++searchVersion.current;
    setSearching(true); setSearchError(''); setSearched(false); setResults([]);
    try {
      const found = await searchPlaces(query);
      if (version === searchVersion.current) { setResults(found); setSearched(true); }
    } catch (e) { if (version === searchVersion.current) setSearchError(getErrorMessage(e)); }
    finally { if (version === searchVersion.current) setSearching(false); }
  };

  const create = async () => {
    if (submitting.current) return;
    if (title.trim().length < 2) return setError('파티 제목을 두 글자 이상 입력해주세요.');
    if (!place) return setError('만날 장소를 검색해서 선택해주세요.');
    const start = parsePartyStart(date, time);
    if (!start) return setError('날짜와 시간을 확인해주세요. 예: 2026-10-05, 19:00');
    if (start.getTime() <= Date.now() + 30 * 60 * 1000) return setError('지금부터 30분 이후의 시간을 선택해주세요.');
    const latest = new Date(); latest.setMonth(latest.getMonth() + 6);
    if (start >= latest) return setError('6개월 이내의 날짜를 선택해주세요.');
    submitting.current = true; setBusy(true); setError('');
    try {
      const party = await partyApi.create({ title: title.trim(), description: description.trim(), category,
        venueName: place.name, venueAddress: place.roadAddress || place.address, latitude: place.lat, longitude: place.lng,
        startsAt: start.toISOString(), capacity });
      router.replace(`/party/${party.id}`);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { submitting.current = false; setBusy(false); }
  };

  if (!user) return <Page><Heading title="함께할 파티를 열어보세요" subtitle="휴대폰 인증 후 원하는 장소에서 모임을 만들 수 있어요." />
    <Button label="로그인하고 파티 만들기" onPress={() => router.replace({ pathname: '/login', params: { redirect: '/party/create' } })} /></Page>;

  return <Page>
    <Stack.Screen options={{ title: '파티 만들기' }} />
    <Heading title="어디서, 무엇을 함께할까요?" subtitle="장소와 시간을 정하면 함께할 사람을 만날 수 있어요." />
    <Panel>
      <Field label="파티 제목" placeholder="예: 퇴근 후 같이 볼링 쳐요" value={title} onChangeText={setTitle} maxLength={80} hint={`${title.length}/80`} editable={!busy} />
      <Text style={[ui.label, { color: c.textPrimary }]}>함께할 활동</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{PARTY_CATEGORIES.map((item) =>
        <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.label} 선택`} accessibilityState={{ selected: category === item.id }}
          disabled={busy} onPress={() => setCategory(item.id)} style={[ui.row, { minHeight: 44, borderWidth: 1, borderRadius: 24, paddingHorizontal: 14,
            borderColor: category === item.id ? c.primary : c.border, backgroundColor: category === item.id ? c.primaryBg : c.cardBg }]}>
          <Ionicons name={item.icon} size={18} color={category === item.id ? c.primary : c.textSecondary} />
          <Text style={{ color: category === item.id ? c.primary : c.textSecondary, fontWeight: '600' }}>{item.label}</Text>
        </Pressable>)}</View>
    </Panel>
    <Panel>
      <Field label="만날 장소" placeholder="예: 마포 볼링장, 연남동 카페" value={query} maxLength={80} editable={!busy}
        onSubmitEditing={() => void search()} returnKeyType="search"
        onChangeText={(value) => { setQuery(value); setPlace(null); setResults([]); setSearched(false); setSearchError(''); searchVersion.current++; setSearching(false); }} />
      <Button label="장소 검색" onPress={() => void search()} busy={searching} disabled={busy} secondary />
      <Notice message={searchError} onRetry={() => void search()} />
      {searched && results.length === 0 && <Text style={[ui.body, { color: c.textSecondary }]}>검색 결과가 없어요. 동네와 장소 이름을 함께 입력해보세요.</Text>}
      {results.map((item) => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.name} 장소 선택`}
        onPress={() => { setPlace(item); setResults([]); setSearched(false); setQuery(item.name); }}
        style={{ paddingVertical: 14, borderBottomWidth: 1, borderColor: c.border, gap: 5 }}>
        <Text style={[ui.label, { color: c.textPrimary }]}>{item.name}</Text>
        <Text style={[ui.body, { color: c.textSecondary }]}>{item.roadAddress || item.address}</Text>
      </Pressable>)}
      {place && <View style={{ backgroundColor: c.primaryBg, borderRadius: 14, padding: 16, gap: 6 }}>
        <Text style={{ color: c.primary, fontWeight: '700' }}>✓ 만날 장소를 선택했어요</Text>
        <Text style={[ui.label, { color: c.textPrimary }]}>{place.name}</Text>
        <Text style={[ui.body, { color: c.textSecondary }]}>{place.roadAddress || place.address}</Text>
      </View>}
    </Panel>
    <Panel>
      <Text style={[ui.label, { color: c.textPrimary }]}>만날 날짜와 시간</Text>
      <View style={ui.row}>{[{ label: '오늘', days: 0 }, { label: '내일', days: 1 }, { label: '일주일 뒤', days: 7 }].map((item) =>
        <Pressable key={item.label} accessibilityRole="button" accessibilityLabel={`${item.label} 선택`} disabled={busy} onPress={() => setDate(localDate(item.days))}
          style={{ minHeight: 44, borderRadius: 22, paddingHorizontal: 15, justifyContent: 'center', backgroundColor: date === localDate(item.days) ? c.primaryBg : c.surfaceSecondary }}>
          <Text style={{ color: date === localDate(item.days) ? c.primary : c.textSecondary }}>{item.label}</Text>
        </Pressable>)}</View>
      <PartySchedulePicker date={date} time={time} onDateChange={setDate} onTimeChange={setTime} disabled={busy} />
      <Text style={[ui.label, { color: c.textPrimary }]}>주최자를 포함한 총 인원</Text>
      <View style={[ui.row, { justifyContent: 'space-between' }]}>
        <Button label="−" accessibilityLabel="인원 줄이기" onPress={() => setCapacity((value) => value - 1)} disabled={busy || capacity <= 2} secondary />
        <Text accessibilityLiveRegion="polite" style={{ color: c.textPrimary, fontSize: 24, fontWeight: '800' }}>{capacity}명</Text>
        <Button label="+" accessibilityLabel="인원 늘리기" onPress={() => setCapacity((value) => value + 1)} disabled={busy || capacity >= 30} secondary />
      </View>
      <Text style={[ui.caption, { color: c.textSecondary }]}>2~30명까지 모집할 수 있어요. 참가 신청은 주최자가 승인해요.</Text>
    </Panel>
    <Panel><Field label="함께할 내용 (선택)" placeholder="어떤 활동을 하나요? 준비물이나 만나는 방법도 알려주세요." value={description} onChangeText={setDescription}
      multiline maxLength={1000} editable={!busy} hint={`${description.length}/1000`} /></Panel>
    <Notice message={error} />
    {busy && <ActivityIndicator color={c.primary} />}
    <Button label="파티 열기" onPress={() => void create()} busy={busy} disabled={searching} />
  </Page>;
}
