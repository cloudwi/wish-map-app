import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { partyApi } from '../../api/party';
import { PlaceResult, searchPlaces } from '../../api/search';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { getErrorMessage } from '../../utils/getErrorMessage';
import { PARTY_CATEGORIES } from '../../constants/party-options';

export default function CreatePartyScreen() {
  const c = useTheme();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('MEAL');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [when, setWhen] = useState('');
  const [capacity, setCapacity] = useState('4');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const search = async () => {
    try { setBusy(true); setError(''); setResults(await searchPlaces(query)); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const create = async () => {
    if (!place) return setError('장소를 검색해서 선택해주세요.');
    const start = new Date(when.trim().replace(' ', 'T'));
    if (!Number.isFinite(start.getTime())) return setError('날짜를 YYYY-MM-DD HH:MM 형식으로 입력해주세요.');
    try {
      setBusy(true); setError('');
      const party = await partyApi.create({
        title, description, category, venueName: place.name,
        venueAddress: place.roadAddress || place.address,
        latitude: place.lat, longitude: place.lng,
        startsAt: start.toISOString(), capacity: Number(capacity),
      });
      router.replace(`/party/${party.id}`);
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  if (!user) return <View style={styles.page}><Text>로그인 후 파티를 만들 수 있어요.</Text><Button label="로그인" color={c.primary} onPress={() => router.replace('/login')} /></View>;

  return <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Stack.Screen options={{ title: '파티 만들기' }} />
    <Text style={[styles.label, { color: c.textPrimary }]}>어떤 모임인가요?</Text>
    <TextInput accessibilityLabel="파티 제목" placeholder="예: 퇴근 후 같이 볼링쳐요" value={title} onChangeText={setTitle}
      style={[styles.input, { color: c.textPrimary, borderColor: c.border }]} />
    <View style={styles.categories}>{PARTY_CATEGORIES.map((item) => <Pressable key={item.id} onPress={() => setCategory(item.id)}
      style={[styles.chip, { borderColor: c.border, backgroundColor: category === item.id ? c.primary : c.cardBg }]}>
      <Text style={{ color: category === item.id ? 'white' : c.textPrimary }}>{item.label}</Text>
    </Pressable>)}</View>
    <Text style={[styles.label, { color: c.textPrimary }]}>어디에서 만날까요?</Text>
    <View style={styles.searchRow}>
      <TextInput accessibilityLabel="장소 검색" placeholder="장소 이름 검색" value={query} onChangeText={setQuery}
        onSubmitEditing={search} style={[styles.input, { color: c.textPrimary, borderColor: c.border, flex: 1 }]} />
      <Pressable onPress={search} style={[styles.searchButton, { backgroundColor: c.primary }]}><Text style={{ color: 'white' }}>검색</Text></Pressable>
    </View>
    {busy && <ActivityIndicator color={c.primary} />}
    {results.map((item) => <Pressable key={item.id} onPress={() => { setPlace(item); setResults([]); setQuery(item.name); }}
      style={[styles.place, { borderColor: c.border }]}>
      <Text style={{ color: c.textPrimary, fontWeight: '600' }}>{item.name}</Text>
      <Text style={{ color: c.textSecondary }}>{item.roadAddress || item.address}</Text>
    </Pressable>)}
    {place && <Text style={{ color: c.primary, marginBottom: 12 }}>선택한 장소: {place.name}</Text>}
    <Text style={[styles.label, { color: c.textPrimary }]}>언제 만날까요?</Text>
    <TextInput accessibilityLabel="시작 일시" placeholder="YYYY-MM-DD HH:MM" value={when} onChangeText={setWhen}
      style={[styles.input, { color: c.textPrimary, borderColor: c.border }]} />
    <Text style={[styles.label, { color: c.textPrimary }]}>총 인원 (주최자 포함)</Text>
    <TextInput accessibilityLabel="총 인원" keyboardType="number-pad" value={capacity} onChangeText={setCapacity}
      style={[styles.input, { color: c.textPrimary, borderColor: c.border }]} />
    <Text style={[styles.label, { color: c.textPrimary }]}>모임 설명</Text>
    <TextInput accessibilityLabel="모임 설명" placeholder="함께할 활동과 만날 때 참고할 내용을 적어주세요" value={description} onChangeText={setDescription}
      multiline style={[styles.input, styles.description, { color: c.textPrimary, borderColor: c.border }]} />
    {error ? <Text style={{ color: c.error, marginTop: 12 }}>{error}</Text> : null}
    <Button label="파티 만들기" color={c.primary} onPress={create} disabled={busy} />
  </ScrollView>;
}

function Button({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.button, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}>
    <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 60, gap: 7 },
  label: { fontSize: 16, fontWeight: '700', marginTop: 18, marginBottom: 5 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchButton: { paddingHorizontal: 15, borderRadius: 10, justifyContent: 'center' },
  place: { borderBottomWidth: 1, paddingVertical: 12, gap: 4 },
  description: { minHeight: 110, textAlignVertical: 'top' },
  button: { marginTop: 25, height: 52, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
