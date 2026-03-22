import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { lightTap } from '../utils/haptics';

interface BaseTabHeaderProps {
  title: string;
  rightContent?: React.ReactNode;
}

function BaseTabHeader({ title, rightContent }: BaseTabHeaderProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { backgroundColor: c.headerBg, paddingTop: insets.top }]}>
      <View style={styles.inner}>
        <View style={styles.left}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
          <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        </View>
        {rightContent}
      </View>
    </View>
  );
}

function AuthenticatedActions() {
  const c = useTheme();

  return (
    <View style={styles.right}>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => { lightTap(); router.push('/notifications'); }}
      >
        <Ionicons name="notifications-outline" size={26} color={c.textPrimary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => { lightTap(); router.push('/friends'); }}
      >
        <Ionicons name="people-outline" size={26} color={c.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

export function MapListTabHeader() {
  const c = useTheme();
  const { isAuthenticated } = useAuthStore();

  return (
    <BaseTabHeader
      title="위시맵"
      rightContent={
        isAuthenticated ? (
          <AuthenticatedActions />
        ) : (
          <View style={styles.right}>
            <TouchableOpacity
              style={[styles.loginBtn, { backgroundColor: c.primary }]}
              onPress={() => { lightTap(); router.push('/login'); }}
            >
              <Text style={styles.loginBtnText}>로그인</Text>
            </TouchableOpacity>
          </View>
        )
      }
    />
  );
}

export function MypageTabHeader() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BaseTabHeader
      title="마이페이지"
      rightContent={isAuthenticated ? <AuthenticatedActions /> : undefined}
    />
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
  },
  inner: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 8,
  },
  logo: {
    width: 28,
    height: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginRight: 4,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
  },
  loginBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginRight: 8,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});
