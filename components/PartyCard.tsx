import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Party } from '../api/party';
import { getPartyCategory } from '../constants/party-options';
import { formatPartyDate } from '../utils/party-date';
import { useTheme } from '../hooks/useTheme';

export function PartyCard({ party, onPress, statusLabel }: { party: Party; onPress: () => void; statusLabel?: string }) {
  const c = useTheme();
  const metadata = getPartyCategory(party.category);
  const remaining = Math.max(0, party.capacity - party.participantCount);
  const state = party.status === 'CANCELLED' ? '취소된 파티' : new Date(party.startsAt) <= new Date() ? '종료된 파티' : statusLabel || (remaining ? `${remaining}자리 남음` : '정원 마감');
  return <Pressable accessibilityRole="button" accessibilityLabel={`${metadata.label}, ${party.title}, ${formatPartyDate(party.startsAt)}, ${state}`}
    onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: pressed ? c.surfaceSecondary : c.cardBg, borderColor: c.border }]}>
    <View style={styles.top}>
      <View style={[styles.badge, { backgroundColor: c.primaryBg }]}><Ionicons name={metadata.icon} size={14} color={c.primary} /><Text style={[styles.badgeText, { color: c.primary }]}>{metadata.label}</Text></View>
      <Text style={[styles.state, { color: party.status === 'CANCELLED' ? c.textSecondary : c.primary }]}>{state}</Text>
    </View>
    <Text numberOfLines={2} style={[styles.title, { color: c.textPrimary }]}>{party.title}</Text>
    <View style={styles.meta}><Ionicons name="time-outline" size={16} color={c.textSecondary} /><Text style={[styles.metaText, { color: c.textPrimary }]}>{formatPartyDate(party.startsAt)}</Text></View>
    <View style={styles.meta}><Ionicons name="location-outline" size={16} color={c.textSecondary} /><Text numberOfLines={1} style={[styles.metaText, { color: c.textSecondary }]}>{party.venueName}</Text></View>
    <Text numberOfLines={1} style={[styles.address, { color: c.textSecondary }]}>{party.venueAddress}</Text>
    <View style={[styles.bottom, { borderColor: c.borderLight }]}>
      <Text numberOfLines={1} style={{ flex: 1, color: c.textSecondary, fontSize: 12 }}>주최 {party.hostNickname}</Text>
      <View style={styles.meta}><Ionicons name="people-outline" size={15} color={c.primary} /><Text style={{ color: c.textPrimary, fontSize: 13, fontWeight: '700' }}>{party.participantCount} / {party.capacity}명</Text></View>
    </View>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 20, padding: 19, marginBottom: 13 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 13 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  state: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 19, lineHeight: 27, fontWeight: '700', marginBottom: 14, letterSpacing: -0.3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  metaText: { flex: 1, fontSize: 14, lineHeight: 20 },
  address: { fontSize: 12, lineHeight: 18, marginTop: 2, marginLeft: 23 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16, paddingTop: 13, borderTopWidth: 1 },
});
