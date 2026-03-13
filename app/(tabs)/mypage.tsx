import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

export default function MyPageScreen() {
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { 
        text: '로그아웃', 
        style: 'destructive',
        onPress: async () => {
          await logout();
        }
      }
    ]);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="person-circle-outline" size={80} color="#ccc" />
        <Text style={styles.authTitle}>로그인이 필요합니다</Text>
        <Text style={styles.authDescription}>
          로그인하고 맛집을 제안하고{'\n'}북마크를 관리해보세요!
        </Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>로그인하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* 프로필 섹션 */}
      <View style={styles.profileSection}>
        <Image
          source={{ uri: user?.profileImage || 'https://via.placeholder.com/80' }}
          style={styles.profileImage}
        />
        <Text style={styles.nickname}>{user?.nickname}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      {/* 메뉴 섹션 */}
      <View style={styles.menuSection}>
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/my-suggestions')}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="restaurant-outline" size={22} color="#FF6B35" />
            <Text style={styles.menuText}>내 제안 목록</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={() => router.push('/bookmarks')}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="bookmark-outline" size={22} color="#FF6B35" />
            <Text style={styles.menuText}>북마크</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="settings-outline" size={22} color="#666" />
            <Text style={styles.menuText}>설정</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="help-circle-outline" size={22} color="#666" />
            <Text style={styles.menuText}>도움말</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <Ionicons name="information-circle-outline" size={22} color="#666" />
            <Text style={styles.menuText}>앱 정보</Text>
          </View>
          <Text style={styles.versionText}>v1.0.0</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={handleLogout}
        >
          <View style={styles.menuLeft}>
            <Ionicons name="log-out-outline" size={22} color="#ff4444" />
            <Text style={[styles.menuText, styles.logoutText]}>로그아웃</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  authDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 10,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eee',
    marginBottom: 12,
  },
  nickname: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#888',
  },
  menuSection: {
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  logoutText: {
    color: '#ff4444',
  },
  versionText: {
    fontSize: 14,
    color: '#999',
  },
  divider: {
    height: 8,
    backgroundColor: '#f5f5f5',
  },
});
