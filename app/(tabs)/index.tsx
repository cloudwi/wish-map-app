import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { partyApi, Party } from '../../api/party';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';

const labels: Record<string, string> = { MEAL: '식사', BOWLING: '볼링', CAFE: '카페', SPORTS: '운동', OTHER: '기타' };

export default function PartiesScreen() {
  const c = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setParties(await partyApi.list(appliedQuery));
    } catch {
      setError('파티를 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [appliedQuery]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.headingRow}>
        <View>
          <Text style={[styles.heading, { color: c.textPrimary }]}>함께할 사람을 찾아요</Text>
          <Text style={{ color: c.textSecondary }}>가고 싶은 장소에서 파티를 시작해보세요</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="파티 만들기"
          onPress={() => router.push(isAuthenticated ? '/party/create' : '/login')}
          style={[styles.add, { backgroundColor: c.primary }]}>
          <Ionicons name="add" size={27} color="white" />
        </Pressable>
      </View>
      <View style={[styles.searchRow, { borderColor: c.border, backgroundColor: c.cardBg }]}>
        <Ionicons name="search" size={20} color={c.textSecondary} />
        <TextInput accessibilityLabel="지역 또는 장소 검색" placeholder="동네, 장소, 파티 검색" value={query}
          onChangeText={setQuery} onSubmitEditing={() => setAppliedQuery(query.trim())}
          style={[styles.searchInput, { color: c.textPrimary }]} returnKeyType="search" />
        <Pressable accessibilityRole="button" onPress={() => setAppliedQuery(query.trim())}>
          <Text style={{ color: c.primary, fontWeight: '700' }}>검색</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 50 }} color={c.primary} /> : (
        <FlatList data={parties} keyExtractor={(item) => String(item.id)}
          refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={[styles.empty, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <Ionicons name="people-outline" size={38} color={c.primary} />
            <Text style={[styles.title, { color: c.textPrimary }]}>{error || '아직 모집 중인 파티가 없어요'}</Text>
            <Text style={{ color: c.textSecondary }}>첫 파티를 만들어 보세요!</Text>
            {error ? <Pressable onPress={load}><Text style={{ color: c.primary }}>다시 시도</Text></Pressable> : null}
          </View>}
          renderItem={({ item }) => <Pressable accessibilityRole="button"
            onPress={() => router.push(`/party/${item.id}`)}
            style={[styles.card, { backgroundColor: c.cardBg, borderColor: c.border }]}>
            <Text style={[styles.category, { color: c.primary }]}>{labels[item.category] || item.category}</Text>
            <Text style={[styles.title, { color: c.textPrimary }]}>{item.title}</Text>
            <Text style={{ color: c.textSecondary, marginTop: 8 }}>{item.venueName} · {item.venueAddress}</Text>
            <Text style={{ color: c.textSecondary, marginTop: 7 }}>
              {new Date(item.startsAt).toLocaleString('ko-KR')} · {item.participantCount}/{item.capacity}명
            </Text>
          </Pressable>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headingRow: { padding: 20, paddingTop: 28, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { fontSize: 24, fontWeight: '700', marginBottom: 6 },
  add: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  searchRow: { marginHorizontal: 20, marginBottom: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, fontSize: 15, minWidth: 0 },
  card: { borderWidth: 1, borderRadius: 16, padding: 18, marginBottom: 12 },
  category: { fontSize: 13, fontWeight: '700', marginBottom: 7 },
  title: { fontSize: 18, fontWeight: '700' },
  empty: { borderWidth: 1, borderRadius: 16, padding: 28, alignItems: 'center', gap: 12 },
});
