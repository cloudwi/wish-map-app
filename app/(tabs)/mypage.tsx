import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert, Switch } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';
import { useAuthStore } from '../../stores/authStore';
import { AuthRequired } from '../../components/AuthRequired';
import { lightTap } from '../../utils/haptics';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  isLast?: boolean;
}

function SettingRow({ icon, iconColor = '#FF6B35', iconBg, label, subtitle, onPress, rightElement, destructive, isLast }: SettingRowProps) {
  const bg = iconBg || (destructive ? '#fff0f0' : '#FFF5F0');
  const color = destructive ? '#ff4444' : iconColor;

  return (
    <TouchableOpacity
      style={[styles.settingRow, !isLast && styles.settingRowBorder]}
      onPress={() => { if (onPress) { lightTap(); onPress(); } }}
      disabled={!onPress && !rightElement}
      activeOpacity={0.6}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, destructive && { color: '#ff4444' }]}>{label}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement}
      {onPress && !rightElement && <Ionicons name="chevron-forward" size={16} color="#ccc" />}
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

  const handleDeleteAccount = () => {
    Alert.alert(
      '계정 탈퇴',
      '계정을 탈퇴하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴', style: 'destructive', onPress: () => { /* TODO: API call */ logout(); } },
      ],
    );
  };

  if (!isAuthenticated) {
    return (
      <AuthRequired
        message={'로그인하고 맛집을 제안하고\n북마크를 관리해보세요!'}
      />
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 프로필 카드 */}
      <Animated.View entering={FadeIn.duration(400)}>
        <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={28} color="#FF6B35" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.nickname}>{user?.nickname}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
        </TouchableOpacity>
      </Animated.View>

      {/* 나의 활동 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>나의 활동</Text>
        <View style={styles.card}>
          <SettingRow icon="restaurant-outline" label="내 제안 목록" onPress={() => router.push('/my-suggestions')} />
          <SettingRow icon="bookmark-outline" label="북마크" onPress={() => router.push('/bookmarks')} isLast />
        </View>
      </View>

      {/* 설정 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>설정</Text>
        <View style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            iconColor="#E8944E"
            iconBg="#FFF8F0"
            label="푸시 알림"
            subtitle="켜짐"
            rightElement={
              <Switch
                value={true}
                trackColor={{ false: '#e0e0e0', true: '#FFD0B8' }}
                thumbColor="#FF6B35"
              />
            }
          />
          <SettingRow icon="settings-outline" iconColor="#888" iconBg="#f5f5f5" label="설정" isLast />
        </View>
      </View>

      {/* 계정 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>계정</Text>
        <View style={styles.card}>
          <SettingRow icon="log-out-outline" iconColor="#E8944E" iconBg="#FFF8F0" label="로그아웃" onPress={handleLogout} />
          <SettingRow icon="trash-outline" label="계정 탈퇴" onPress={handleDeleteAccount} destructive isLast />
        </View>
      </View>

      {/* 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>정보</Text>
        <View style={styles.card}>
          <SettingRow icon="document-text-outline" iconColor="#5B8EC9" iconBg="#F0F5FF" label="개인정보 처리방침" onPress={() => router.push('/legal/privacy')} />
          <SettingRow icon="document-outline" iconColor="#5B8EC9" iconBg="#F0F5FF" label="이용약관" onPress={() => router.push('/legal/terms')} />
          <SettingRow icon="chatbubble-outline" iconColor="#4CAF82" iconBg="#F0FFF5" label="문의하기" isLast />
        </View>
      </View>

      {/* 앱 정보 */}
      <View style={styles.appInfo}>
        <Text style={styles.appName}>위시맵</Text>
        <Text style={styles.appVersion}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF5F0',
  },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1 },
  nickname: { fontSize: 18, fontWeight: '700', color: '#333' },
  email: { fontSize: 13, color: '#999', marginTop: 2 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: 56,
  },
  settingRowBorder: { borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#333' },
  settingSubtitle: { fontSize: 12, color: '#999', marginTop: 1 },
  appInfo: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  appName: { fontSize: 13, fontWeight: '500', color: '#bbb' },
  appVersion: { fontSize: 11, color: '#ccc' },
});
