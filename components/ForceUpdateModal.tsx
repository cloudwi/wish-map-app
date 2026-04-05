import { StyleSheet, View, Text, TouchableOpacity, Modal, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { getForceUpdateStoreUrl } from '../api/client';

const FALLBACK_STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/id6760577746',
  android: 'https://play.google.com/store/apps/details?id=com.wishmap.app',
}) || '';

interface ForceUpdateModalProps {
  visible: boolean;
}

export function ForceUpdateModal({ visible }: ForceUpdateModalProps) {
  const c = useTheme();

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Ionicons name="arrow-up-circle-outline" size={64} color={c.primary} />
        <Text style={[styles.title, { color: c.textPrimary }]}>업데이트가 필요합니다</Text>
        <Text style={[styles.desc, { color: c.textSecondary }]}>
          새로운 버전이 출시되었습니다.{'\n'}최신 버전으로 업데이트해주세요.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: c.primary }]}
          onPress={() => Linking.openURL(getForceUpdateStoreUrl() || FALLBACK_STORE_URL)}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>업데이트</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  title: { fontSize: 22, fontWeight: '700' },
  desc: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  btn: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  btnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
