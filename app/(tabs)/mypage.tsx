import { useState, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert, Switch, Linking, Platform } from 'react-native';
import { MypageTabHeader } from '../../components/TabHeader';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAuthStore } from '../../stores/authStore';
import { AuthRequired } from '../../components/AuthRequired';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore } from '../../stores/themeStore';
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

function SettingRow({ icon, iconColor, iconBg, label, subtitle, onPress, rightElement, destructive, isLast }: SettingRowProps) {
  const c = useTheme();
  const bg = iconBg || (destructive ? c.errorBg : c.primaryBg);
  const color = destructive ? c.error : (iconColor || c.primary);

  return (
    <TouchableOpacity
      style={[styles.settingRow, !isLast && { borderBottomWidth: 0.5, borderBottomColor: c.divider }]}
      onPress={() => { if (onPress) { lightTap(); onPress(); } }}
      disabled={!onPress && !rightElement}
      activeOpacity={0.6}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingLabel, { color: destructive ? c.error : c.textPrimary }]}>{label}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: c.textTertiary }]}>{subtitle}</Text>}
      </View>
      {rightElement}
      {onPress && !rightElement && <Ionicons name="chevron-forward" size={16} color={c.textDisabled} />}
    </TouchableOpacity>
  );
}

const SUPPORT_EMAIL = 'support@wishmap.app';

export default function MyPageScreen() {
  const c = useTheme();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { mode: themeMode, setMode: setThemeMode } = useThemeStore();
  const [pushEnabled, setPushEnabled] = useState(false);

  const themeLabel = themeMode === 'system' ? '시스템' : themeMode === 'dark' ? '다크' : '라이트';
  const handleThemeToggle = () => {
    lightTap();
    const next = themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
    setThemeMode(next);
  };

  const handleTogglePush = (value: boolean) => {
    if (value) {
      Alert.alert(
        '푸시 알림 켜기',
        '시스템 설정에서 알림을 허용해주세요.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '설정 열기',
            onPress: () => {
              setPushEnabled(true);
              Linking.openSettings();
            },
          },
        ],
      );
    } else {
      Alert.alert(
        '푸시 알림 끄기',
        '알림을 받지 않으시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '끄기',
            style: 'destructive',
            onPress: () => setPushEnabled(false),
          },
        ],
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: async () => { await logout(); router.navigate('/(tabs)'); } },
    ]);
  };

  const handleContact = () => {
    const subject = encodeURIComponent('[위시맵] 문의');
    const body = encodeURIComponent(`\n\n---\n앱 버전: ${Constants.expoConfig?.version ?? '1.0.0'}\nOS: ${Platform.OS} ${Platform.Version}`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`);
  };

  if (!isAuthenticated) {
    return (
      <AuthRequired
        message={'로그인하고 맛집을 제안하고\n컬렉션을 관리해보세요!'}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
    <MypageTabHeader />
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* 프로필 카드 */}
      <Animated.View entering={FadeIn.duration(400)}>
        <View style={[styles.profileCard, { backgroundColor: c.cardBg }]}>
          <View style={styles.profileTop}>
            {user?.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={[styles.avatar, { backgroundColor: c.primaryBg }]} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: c.primaryBg }]}>
                <Ionicons name="person" size={32} color={c.primary} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.nickname, { color: c.textPrimary }]}>{user?.nickname}</Text>
            </View>
          </View>
        </View>
      </Animated.View>

      {/* 나의 활동 */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>나의 활동</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg }]}>
          <SettingRow icon="restaurant-outline" label="내 제안 목록" onPress={() => router.push('/my-suggestions')} />
          <SettingRow icon="heart-outline" label="내 컬렉션" onPress={() => router.push('/bookmarks')} isLast />
        </View>
      </View>

      {/* 설정 */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>설정</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg }]}>
          <SettingRow
            icon={themeMode === 'dark' ? 'moon' : themeMode === 'light' ? 'sunny' : 'phone-portrait-outline'}
            iconColor="#7C6DD8"
            iconBg={c.primaryBg}
            label="테마"
            subtitle={themeLabel}
            onPress={handleThemeToggle}
          />
          <SettingRow
            icon="notifications-outline"
            iconColor="#E8944E"
            iconBg={c.warningBg}
            label="푸시 알림"
            rightElement={
              <Switch
                value={pushEnabled}
                onValueChange={handleTogglePush}
                trackColor={{ false: c.border, true: c.primary }}
                thumbColor="#fff"
              />
            }
            isLast
          />
        </View>
      </View>

      {/* 계정 */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>계정</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg }]}>
          <SettingRow icon="log-out-outline" iconColor="#E8944E" iconBg={c.warningBg} label="로그아웃" onPress={handleLogout} isLast />
        </View>
      </View>

      {/* 정보 */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>정보</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg }]}>
          <SettingRow icon="document-text-outline" iconColor="#5B8EC9" iconBg={c.infoBg} label="개인정보 처리방침" onPress={() => router.push('/legal/privacy')} />
          <SettingRow icon="document-outline" iconColor="#5B8EC9" iconBg={c.infoBg} label="이용약관" onPress={() => router.push('/legal/terms')} />
          <SettingRow icon="chatbubble-outline" iconColor="#4CAF82" iconBg={c.successBg} label="문의하기" onPress={handleContact} isLast />
        </View>
      </View>

      {/* 앱 정보 */}
      <View style={styles.appInfo}>
        <Text style={[styles.appName, { color: c.textDisabled }]}>위시맵</Text>
        <Text style={[styles.appVersion, { color: c.textDisabled }]}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1 },
  nickname: { fontSize: 20, fontWeight: '800' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
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
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 12, marginTop: 1 },
  appInfo: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  appName: { fontSize: 13, fontWeight: '500' },
  appVersion: { fontSize: 11 },
});
