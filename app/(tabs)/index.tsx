import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Keyboard, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { partyApi, Party } from '../../api/party';
import { PARTY_CATEGORIES, getPartyCategory } from '../../constants/party-options';
import { formatPartyDate, getPartyDateUpperBound, PartyDateFilter } from '../../utils/party-date';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';

const PAGE_SIZE = 24;
const dateFilters: { id: PartyDateFilter; label: string }[] = [
  { id: 'ANY', label: '전체 날짜' }, { id: 'TODAY', label: '오늘' }, { id: 'THIS_WEEK', label: '이번 주' },
];
const categories = [{ id: 'ALL', label: '전체', icon: 'grid-outline' as const }, ...PARTY_CATEGORIES];

export default function PartiesScreen() {
  const c = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [category, setCategory] = useState('ALL');
  const [dateFilter, setDateFilter] = useState<PartyDateFilter>('ANY');
  const [availableOnly, setAvailableOnly] = useState(true);
  const requestVersion = useRef(0);
  const page = useRef(0);
  const fetchingMore = useRef(false);

  const options = useCallback((pageNumber: number) => ({
    category: category === 'ALL' ? undefined : category,
    startsBefore: getPartyDateUpperBound(dateFilter),
    availableOnly, limit: PAGE_SIZE, page: pageNumber,
  }), [category, dateFilter, availableOnly]);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    const version = ++requestVersion.current;
    fetchingMore.current = false;
    setLoadingMore(false);
    setError('');
    if (mode === 'refresh') setRefreshing(true);
    else { setLoading(true); setParties([]); }
    try {
      const result = await partyApi.list(appliedQuery, options(0));
      if (version !== requestVersion.current) return;
      page.current = 0;
      setParties(result);
      setHasMore(result.length === PAGE_SIZE);
    } catch {
      if (version === requestVersion.current) setError('파티를 불러오지 못했어요. 연결을 확인하고 다시 시도해주세요.');
    } finally {
      if (version === requestVersion.current) { setLoading(false); setRefreshing(false); }
    }
  }, [appliedQuery, options]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestVersion.current++; };
  }, [load]));

  const loadMore = useCallback(async () => {
    if (loading || refreshing || !hasMore || fetchingMore.current) return;
    const version = requestVersion.current;
    const nextPage = page.current + 1;
    fetchingMore.current = true;
    setLoadingMore(true);
    setError('');
    try {
      const result = await partyApi.list(appliedQuery, options(nextPage));
      if (version !== requestVersion.current) return;
      page.current = nextPage;
      setParties((current) => Array.from(new Map([...current, ...result].map((item) => [item.id, item])).values()));
      setHasMore(result.length === PAGE_SIZE);
    } catch {
      if (version === requestVersion.current) setError('다음 파티를 불러오지 못했어요. 다시 시도해주세요.');
    } finally {
      if (version === requestVersion.current) { fetchingMore.current = false; setLoadingMore(false); }
    }
  }, [loading, refreshing, hasMore, appliedQuery, options]);

  const createParty = () => router.push(isAuthenticated ? '/party/create' : '/login');
  const search = () => { Keyboard.dismiss(); setAppliedQuery(query.trim()); };
  const clearFilters = () => {
    setQuery(''); setAppliedQuery(''); setCategory('ALL'); setDateFilter('ANY'); setAvailableOnly(true);
  };
  const filtered = !!appliedQuery || category !== 'ALL' || dateFilter !== 'ANY';

  const header = <View>
    <View style={styles.brandRow}>
      <View style={styles.brand}>
        <Ionicons name="location" size={24} color={c.primary} />
        <Text style={[styles.brandText, { color: c.textPrimary }]}>wish map</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="파티 만들기" onPress={createParty}
        style={[styles.createButton, { backgroundColor: c.primaryBg }]}>
        <Ionicons name="add" size={18} color={c.primary} />
        <Text style={[styles.createLabel, { color: c.primary }]}>파티 만들기</Text>
      </Pressable>
    </View>
    <View style={styles.hero}>
      <Text style={[styles.heading, { color: c.textPrimary }]}>좋아하는 활동을,{ '\n' }함께할 사람을 찾아요</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>원하는 동네에서 가볍게 시작하는 모임</Text>
    </View>
    <View style={[styles.searchRow, { backgroundColor: c.searchBg }]}>
      <Ionicons name="search-outline" size={21} color={c.textSecondary} />
      <TextInput accessibilityLabel="동네, 장소, 파티 검색" placeholder="동네, 장소, 파티를 검색해보세요"
        placeholderTextColor={c.textSecondary} value={query} onChangeText={setQuery} onSubmitEditing={search}
        style={[styles.searchInput, { color: c.textPrimary }]} returnKeyType="search" />
      {!!query && <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기"
        onPress={() => { setQuery(''); setAppliedQuery(''); }} style={styles.clearButton}>
        <Ionicons name="close-circle" size={19} color={c.textSecondary} />
      </Pressable>}
      <Pressable accessibilityRole="button" accessibilityLabel="파티 검색" onPress={search} style={styles.searchButton}>
        <Text style={{ color: c.primary, fontWeight: '700' }}>검색</Text>
      </Pressable>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
      {categories.map((item) => {
        const selected = category === item.id;
        return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.label} 파티`}
          accessibilityState={{ selected }} onPress={() => setCategory(item.id)} style={styles.categoryButton}>
          <View style={[styles.categoryIcon, { backgroundColor: selected ? c.primary : c.surfaceSecondary,
            borderColor: selected ? c.primary : c.border }]}>
            <Ionicons name={item.icon} size={25} color={selected ? 'white' : c.textSecondary} />
          </View>
          <Text style={[styles.categoryLabel, { color: selected ? c.primary : c.textSecondary,
            fontWeight: selected ? '700' : '500' }]}>{item.label}</Text>
        </Pressable>;
      })}
    </ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
      {dateFilters.map((item) => <Pressable key={item.id} accessibilityRole="button"
        accessibilityLabel={item.label} accessibilityState={{ selected: dateFilter === item.id }}
        onPress={() => setDateFilter(item.id)} style={[styles.filterChip, {
          backgroundColor: dateFilter === item.id ? c.chipActiveBg : c.cardBg,
          borderColor: dateFilter === item.id ? c.chipActiveBg : c.border,
        }]}>
        <Text style={[styles.filterText, { color: dateFilter === item.id ? c.chipActiveText : c.textSecondary }]}>{item.label}</Text>
      </Pressable>)}
      <Pressable accessibilityRole="checkbox" accessibilityLabel="자리 있는 파티만 보기"
        accessibilityState={{ checked: availableOnly }} onPress={() => setAvailableOnly((value) => !value)}
        style={[styles.filterChip, { borderColor: availableOnly ? c.primary : c.border,
          backgroundColor: availableOnly ? c.primaryBg : c.cardBg }]}>
        <Ionicons name={availableOnly ? 'checkmark-circle' : 'ellipse-outline'} size={16}
          color={availableOnly ? c.primary : c.textSecondary} />
        <Text style={[styles.filterText, { color: availableOnly ? c.primary : c.textSecondary }]}>자리 있는 파티</Text>
      </Pressable>
    </ScrollView>
    <View style={styles.listHeading}>
      <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
        {category === 'ALL' ? '함께할 파티' : `${getPartyCategory(category).label} 파티`}
      </Text>
      <Text style={[styles.sortLabel, { color: c.textSecondary }]}>시작이 가까운 순</Text>
    </View>
    {!!error && parties.length > 0 && <View accessibilityRole="alert" style={[styles.errorBanner, { backgroundColor: c.errorBg }]}>
      <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
      <Pressable accessibilityRole="button" onPress={() => void load('refresh')} style={styles.retryButton}>
        <Text style={{ color: c.error, fontWeight: '700' }}>다시 시도</Text>
      </Pressable>
    </View>}
  </View>;

  return <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: c.background }]}>
    <FlatList data={parties} keyExtractor={(item) => String(item.id)} ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load('refresh')} tintColor={c.primary} colors={[c.primary]} />}
      onEndReached={() => { if (!error) void loadMore(); }} onEndReachedThreshold={0.4}
      ListEmptyComponent={loading ? <View style={styles.empty}>
        <ActivityIndicator color={c.primary} />
        <Text style={{ color: c.textSecondary }}>함께할 파티를 찾고 있어요</Text>
      </View> : <View style={[styles.empty, { backgroundColor: c.cardBg, borderColor: c.border }]}>
        <View style={[styles.emptyIcon, { backgroundColor: error ? c.errorBg : c.primaryBg }]}>
          <Ionicons name={error ? 'cloud-offline-outline' : 'people-outline'} size={30} color={error ? c.error : c.primary} />
        </View>
        <Text accessibilityRole={error ? 'alert' : undefined} style={[styles.emptyTitle, { color: c.textPrimary }]}>
          {error ? '잠시 연결이 원활하지 않아요' : filtered ? '조건에 맞는 파티가 없어요' : '첫 파티를 열어볼까요?'}
        </Text>
        <Text style={[styles.emptyDescription, { color: c.textSecondary }]}>
          {error || (filtered ? '동네, 활동, 날짜 조건을 바꿔서 찾아보세요.' : '가고 싶은 장소와 시간을 골라\n함께할 사람을 초대해보세요.')}
        </Text>
        <Pressable accessibilityRole="button" onPress={error ? () => void load() : filtered ? clearFilters : createParty}
          style={[styles.emptyAction, { backgroundColor: c.primary }]}>
          <Text style={styles.emptyActionLabel}>{error ? '다시 시도' : filtered ? '필터 초기화' : '파티 만들기'}</Text>
        </Pressable>
      </View>}
      ListFooterComponent={parties.length > 0 ? <View style={styles.footer}>
        {loadingMore ? <ActivityIndicator color={c.primary} /> : hasMore ? <Pressable accessibilityRole="button"
          onPress={() => void loadMore()} style={[styles.moreButton, { borderColor: c.border }]}>
          <Text style={{ color: c.textSecondary, fontWeight: '600' }}>파티 더 보기</Text>
        </Pressable> : <Text style={{ color: c.textSecondary }}>원하는 모임이 없다면 직접 파티를 열어보세요.</Text>}
      </View> : null}
      renderItem={({ item }) => {
        const metadata = getPartyCategory(item.category);
        const remaining = Math.max(0, item.capacity - item.participantCount);
        return <Pressable accessibilityRole="button" accessibilityLabel={`${metadata.label}, ${item.title}, ${formatPartyDate(item.startsAt)}, ${remaining}자리 남음`}
          onPress={() => router.push(`/party/${item.id}`)} style={({ pressed }) => [styles.card, {
            backgroundColor: pressed ? c.surfaceSecondary : c.cardBg, borderColor: c.border,
          }]}>
          <View style={styles.cardTop}>
            <View style={[styles.categoryBadge, { backgroundColor: c.primaryBg }]}>
              <Ionicons name={metadata.icon} size={14} color={c.primary} />
              <Text style={[styles.badgeText, { color: c.primary }]}>{metadata.label}</Text>
            </View>
            <Text style={[styles.seats, { color: remaining === 0 ? c.textSecondary : remaining <= 2 ? c.primary : c.success }]}>
              {remaining === 0 ? '정원 마감' : `${remaining}자리 남음`}
            </Text>
          </View>
          <Text numberOfLines={2} style={[styles.cardTitle, { color: c.textPrimary }]}>{item.title}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={c.textSecondary} />
            <Text style={[styles.metaText, { color: c.textPrimary }]}>{formatPartyDate(item.startsAt)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={c.textSecondary} />
            <Text numberOfLines={1} style={[styles.metaText, { color: c.textSecondary }]}>{item.venueName}</Text>
          </View>
          <Text numberOfLines={1} style={[styles.address, { color: c.textSecondary }]}>{item.venueAddress}</Text>
          <View style={[styles.cardBottom, { borderColor: c.borderLight }]}>
            <Text numberOfLines={1} style={[styles.host, { color: c.textSecondary }]}>주최 {item.hostNickname}</Text>
            <View style={styles.peopleCount}>
              <Ionicons name="people-outline" size={15} color={c.primary} />
              <Text style={[styles.count, { color: c.textPrimary }]}>{item.participantCount}<Text style={{ color: c.textSecondary }}> / {item.capacity}명</Text></Text>
            </View>
          </View>
        </Pressable>;
      }} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { width: '100%', maxWidth: 720, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 32 },
  brandRow: { minHeight: 68, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  brandText: { fontSize: 22, fontWeight: '800', letterSpacing: -0.7 },
  createButton: { minHeight: 44, paddingHorizontal: 12, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 3 },
  createLabel: { fontSize: 12, fontWeight: '700' },
  hero: { paddingTop: 14, paddingBottom: 22 },
  heading: { fontSize: 28, lineHeight: 38, fontWeight: '800', letterSpacing: -0.8 },
  subtitle: { fontSize: 14, lineHeight: 21, marginTop: 9 },
  searchRow: { borderRadius: 15, minHeight: 54, paddingLeft: 15, paddingRight: 5, flexDirection: 'row', alignItems: 'center', gap: 7 },
  searchInput: { flex: 1, fontSize: 14, minWidth: 0, paddingVertical: 13 },
  searchButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  clearButton: { minWidth: 30, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  categories: { gap: 13, paddingTop: 23, paddingBottom: 21 },
  categoryButton: { alignItems: 'center', gap: 8, minWidth: 48 },
  categoryIcon: { width: 50, height: 50, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { fontSize: 12 },
  filters: { gap: 7, paddingBottom: 23 },
  filterChip: { minHeight: 44, borderWidth: 1, borderRadius: 22, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 5 },
  filterText: { fontSize: 12, fontWeight: '600' },
  listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 15 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  sortLabel: { fontSize: 12 },
  card: { borderWidth: 1, borderRadius: 20, padding: 19, marginBottom: 13 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 13 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  seats: { fontSize: 12, fontWeight: '700' },
  cardTitle: { fontSize: 19, lineHeight: 27, fontWeight: '700', marginBottom: 14, letterSpacing: -0.3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  metaText: { flex: 1, fontSize: 14, lineHeight: 20 },
  address: { fontSize: 12, lineHeight: 18, marginTop: 2, marginLeft: 23 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, paddingTop: 13, borderTopWidth: 1 },
  host: { flex: 1, fontSize: 12 },
  peopleCount: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  count: { fontSize: 13, fontWeight: '700' },
  empty: { borderWidth: 1, borderColor: 'transparent', borderRadius: 20, padding: 26, alignItems: 'center', gap: 12, marginBottom: 20 },
  emptyIcon: { width: 60, height: 60, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  emptyTitle: { fontSize: 18, lineHeight: 26, fontWeight: '700', textAlign: 'center' },
  emptyDescription: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  emptyAction: { minHeight: 46, borderRadius: 12, paddingHorizontal: 22, justifyContent: 'center', marginTop: 5 },
  emptyActionLabel: { color: 'white', fontSize: 14, fontWeight: '700' },
  errorBanner: { padding: 14, borderRadius: 12, marginBottom: 14, gap: 4 },
  errorText: { fontSize: 13, lineHeight: 20 },
  retryButton: { minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' },
  footer: { alignItems: 'center', paddingTop: 12, paddingBottom: 18 },
  moreButton: { minHeight: 46, borderWidth: 1, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 28 },
});
