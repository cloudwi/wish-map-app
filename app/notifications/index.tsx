import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { notificationApi, NotificationResponse } from '../../api/notification';
import { useTheme } from '../../hooks/useTheme';

export default function NotificationsScreen() {
  const c = useTheme();
  const [items, setItems] = useState<NotificationResponse[]>([]);

  useEffect(() => {
    notificationApi.getNotifications(0, 50).then((page) => {
      setItems(page.content);
      notificationApi.markAllAsRead().catch(() => {});
    }).catch(() => {});
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen options={{ title: '알림' }} />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={{ color: c.textSecondary }}>알림이 없습니다.</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => item.referenceId && router.push(`/party/${item.referenceId}`)}
            style={[styles.item, { borderBottomColor: c.border }]}>
            <Text style={[styles.title, { color: c.textPrimary }]}>{item.title}</Text>
            <Text style={{ color: c.textSecondary }}>{item.message}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: { padding: 20 },
  item: { paddingVertical: 16, borderBottomWidth: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600' },
});
