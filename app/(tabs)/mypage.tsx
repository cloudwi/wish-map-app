import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert, Switch, Linking, Platform } from 'react-native';
import { MypageTabHeader } from '../../components/TabHeader';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../stores/authStore';
import { AuthRequired } from '../../components/AuthRequired';
import { useTheme } from '../../hooks/useTheme';
import { useThemeStore } from '../../stores/themeStore';
import { lightTap } from '../../utils/haptics';
import { showSuccess, showError } from '../../utils/toast';
import { getErrorMessage } from '../../utils/getErrorMessage';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
  isLast?: boolean;
}

function SettingRow({ icon, label, subtitle, onPress, rightElement, destructive, isLast }: SettingRowProps) {
  const c = useTheme();
  const color = destructive ? c.error : c.textSecondary;

  return (
    <TouchableOpacity
      style={[styles.settingRow, !isLast && { borderBottomWidth: 0.5, borderBottomColor: c.divider }]}
      onPress={() => { if (onPress) { lightTap(); onPress(); } }}
      disabled={!onPress && !rightElement}
      activeOpacity={0.6}
    >
      <Ionicons name={icon} size={20} color={color} />
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
  const { isAuthenticated, user, logout, updateNickname } = useAuthStore();
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

  const handleNicknameChange = () => {
    lightTap();
    Alert.prompt(
      '닉네임 변경',
      '새 닉네임을 입력해주세요 (2~10자)',
      async (text) => {
        const nickname = text?.trim();
        if (!nickname) return;
        if (nickname.length < 2 || nickname.length > 10) {
          showError('닉네임 오류', '닉네임은 2~10자여야 합니다');
          return;
        }
        try {
          await updateNickname(nickname);
          showSuccess('변경 완료', '닉네임이 변경되었습니다');
        } catch (error: unknown) {
          showError('변경 실패', getErrorMessage(error, '닉네임 변경 중 오류가 발생했습니다'));
        }
      },
      'plain-text',
      user?.nickname,
    );
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
      <View style={[styles.profileCard, { backgroundColor: c.cardBg, borderColor: c.border }]}>
        <View style={styles.profileTop}>
          {user?.profileImage ? (
            <Image source={{ uri: user.profileImage }} style={[styles.avatar, { backgroundColor: c.primaryBg }]} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: c.primaryBg }]}>
              <Ionicons name="person" size={32} color={c.primary} />
            </View>
          )}
          <View style={styles.profileInfo}>
            <TouchableOpacity style={styles.nicknameRow} onPress={handleNicknameChange} activeOpacity={0.6}>
              <Text style={[styles.nickname, { color: c.textPrimary }]}>{user?.nickname}</Text>
              <Ionicons name="pencil" size={14} color={c.textDisabled} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

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
            label="테마"
            subtitle={themeLabel}
            onPress={handleThemeToggle}
          />
          <SettingRow
            icon="notifications-outline"
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
          <SettingRow icon="log-out-outline" label="로그아웃" onPress={handleLogout} isLast />
        </View>
      </View>

      {/* 정보 */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textTertiary }]}>정보</Text>
        <View style={[styles.card, { backgroundColor: c.cardBg }]}>
          <SettingRow icon="document-text-outline" label="개인정보 처리방침" onPress={() => router.push('/legal/privacy')} />
          <SettingRow icon="document-outline" label="이용약관" onPress={() => router.push('/legal/terms')} />
          <SettingRow icon="chatbubble-outline" label="문의하기" onPress={handleContact} isLast />
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
    borderRadius: 10,
    borderWidth: 0.5,
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
  nicknameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nickname: { fontSize: 20, fontWeight: '600' },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: 56,
  },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 12, marginTop: 1 },
  appInfo: { alignItems: 'center', paddingVertical: 32, gap: 4 },
  appName: { fontSize: 13, fontWeight: '500' },
  appVersion: { fontSize: 11 },
});
