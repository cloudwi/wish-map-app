import { StyleSheet, View, Text, FlatList, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';

// TODO: 백엔드 알림 API 연동 후 실제 데이터로 교체
const MOCK_NOTIFICATIONS: { id: string; title: string; body: string; date: string; read: boolean }[] = [];

export default function NotificationsScreen() {
  const c = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{
        title: '알림',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} hitSlop={8} style={{ padding: 4 }}>
            <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} size={24} color={c.textPrimary} />
          </TouchableOpacity>
        ),
      }} />
      <FlatList
        data={MOCK_NOTIFICATIONS}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.item, { backgroundColor: c.cardBg }, !item.read && { backgroundColor: c.primaryBg }]}>
            <View style={[styles.dot, { backgroundColor: c.border }, !item.read && { backgroundColor: c.primary }]} />
            <View style={styles.content}>
              <Text style={[styles.title, { color: c.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.body, { color: c.textSecondary }]} numberOfLines={2}>{item.body}</Text>
              <Text style={[styles.date, { color: c.textDisabled }]}>{item.date}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={MOCK_NOTIFICATIONS.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="notifications-outline" size={40} color={c.textDisabled} />
            <Text style={[styles.emptyTitle, { color: c.textSecondary }]}>아직 알림이 없어요</Text>
            <Text style={[styles.emptyDesc, { color: c.textTertiary }]}>
              {'맛집이 승인되거나 새로운 소식이 있으면\n여기에서 알려드릴게요'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 16 },
  emptyContainer: { flex: 1 },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    gap: 12,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', marginBottom: 4 },
  body: { fontSize: 13, lineHeight: 18 },
  date: { fontSize: 11, marginTop: 6 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
