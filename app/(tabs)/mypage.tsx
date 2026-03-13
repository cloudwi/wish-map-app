import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { AuthRequired } from '../../components/AuthRequired';

function MenuItem({
  icon, label, onPress, right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={22} color={label === '로그아웃' ? '#ff4444' : '#FF6B35'} />
        <Text style={[styles.menuText, label === '로그아웃' && styles.logoutText]}>{label}</Text>
      </View>
      {right ?? <Ionicons name="chevron-forward" size={20} color="#ccc" />}
    </TouchableOpacity>
  );
}

export default function MyPageScreen() {
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  };

  if (!isAuthenticated) {
    return (
      <AuthRequired
        message={'로그인하고 맛집을 제안하고\n북마크를 관리해보세요!'}
      />
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 */}
      <View style={styles.profile}>
        <Image
          source={{ uri: user?.profileImage || 'https://via.placeholder.com/80' }}
          style={styles.avatar}
        />
        <Text style={styles.nickname}>{user?.nickname}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* 메뉴 */}
      <View style={styles.section}>
        <MenuItem icon="restaurant-outline" label="내 제안 목록" onPress={() => router.push('/my-suggestions')} />
        <MenuItem icon="bookmark-outline"   label="북마크"       onPress={() => router.push('/bookmarks')} />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <MenuItem icon="settings-outline"            label="설정" />
        <MenuItem icon="help-circle-outline"         label="도움말" />
        <MenuItem icon="information-circle-outline"  label="앱 정보" right={<Text style={styles.version}>v1.0.0</Text>} />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <MenuItem icon="log-out-outline" label="로그아웃" onPress={handleLogout} right={null} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profile: { backgroundColor: '#fff', alignItems: 'center', paddingVertical: 30, marginBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#eee', marginBottom: 12 },
  nickname: { fontSize: 20, fontWeight: '600', color: '#333', marginBottom: 4 },
  email: { fontSize: 14, color: '#888' },
  section: { backgroundColor: '#fff' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuText: { fontSize: 16, color: '#333' },
  logoutText: { color: '#ff4444' },
  version: { fontSize: 14, color: '#999' },
  divider: { height: 8, backgroundColor: '#f5f5f5' },
});
