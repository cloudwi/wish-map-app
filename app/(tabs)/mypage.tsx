import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { authApi } from '../../api/auth';
import { showError } from '../../utils/toast';
import { getErrorMessage } from '../../utils/getErrorMessage';

export default function MyPageScreen() {
  const c = useTheme();
  const { isAuthenticated, user, logout } = useAuthStore();

  const deleteAccount = () => Alert.alert(
    '계정 탈퇴',
    '계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '탈퇴하기', style: 'destructive',
        onPress: async () => {
          try {
            await authApi.deleteAccount();
            await logout();
            router.replace('/(tabs)');
          } catch (error) {
            showError('탈퇴 실패', getErrorMessage(error));
          }
        },
      },
    ],
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.heading, { color: c.textPrimary }]}>마이</Text>
      {!isAuthenticated ? (
        <TouchableOpacity style={[styles.button, { backgroundColor: c.primary }]} onPress={() => router.push('/login')}>
          <Text style={styles.buttonText}>로그인</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Text style={[styles.nickname, { color: c.textPrimary }]}>{user?.nickname}</Text>
          <Row label="알림" onPress={() => router.push('/notifications')} color={c.textPrimary} border={c.border} />
          <Row label="차단 목록" onPress={() => router.push('/blocked-users')} color={c.textPrimary} border={c.border} />
          <Row label="로그아웃" onPress={async () => { await logout(); router.replace('/(tabs)'); }} color={c.textPrimary} border={c.border} />
          <Row label="계정 탈퇴" onPress={deleteAccount} color={c.error} border={c.border} />
        </>
      )}
      <Row label="이용약관" onPress={() => router.push('/legal/terms')} color={c.textPrimary} border={c.border} />
      <Row label="개인정보 처리방침" onPress={() => router.push('/legal/privacy')} color={c.textPrimary} border={c.border} />
    </ScrollView>
  );
}

function Row({ label, onPress, color, border }: {
  label: string; onPress: () => void; color: string; border: string;
}) {
  return (
    <TouchableOpacity style={[styles.row, { borderBottomColor: border }]} onPress={onPress}>
      <Text style={{ color, fontSize: 16 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  heading: { fontSize: 25, fontWeight: '700', marginTop: 24, marginBottom: 20 },
  nickname: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
  button: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  row: { paddingVertical: 18, borderBottomWidth: 1 },
});
