import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Tabs, router } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useEffect } from 'react';
import { TermsAgreementModal } from '../../components/TermsAgreementModal';

const isIOS26 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 19;

export default function TabLayout() {
  const { checkAuth, isAuthenticated, isLoading, hasAgreedToTerms, isCheckingTerms, setTermsAgreed, logout } = useAuthStore();
  const c = useTheme();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    checkAuth();
  }, []);

  const handleTermsCancel = async () => {
    await logout();
    router.replace('/login');
  };

  const termsModal = (
    <TermsAgreementModal
      visible={isAuthenticated && !hasAgreedToTerms && !isLoading && !isCheckingTerms}
      onAgree={setTermsAgreed}
      onCancel={handleTermsCancel}
    />
  );

  // Android: JS 기반 커스텀 탭바. 해외 서비스 스타일(미니멀, 얇은 상단 디바이더, 라운드 느낌 없음).
  if (Platform.OS === 'android') {
    return (
      <>
        {termsModal}
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: c.primary,
            tabBarInactiveTintColor: c.textSecondary,
            tabBarStyle: {
              backgroundColor: c.surface,
              borderTopWidth: 0.5,
              borderTopColor: c.border,
              elevation: 0,
              height: 56 + insets.bottom,
              paddingTop: 6,
              paddingBottom: 6 + insets.bottom,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: 2 },
            tabBarItemStyle: { paddingVertical: 2 },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: '지도',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'map' : 'map-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="list"
            options={{
              title: '장소',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'compass' : 'compass-outline'} size={22} color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="mypage"
            options={{
              title: '마이',
              tabBarIcon: ({ color, focused }) => (
                <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
              ),
            }}
          />
        </Tabs>
      </>
    );
  }

  // iOS: 네이티브 탭 + 블러 유지
  return (
    <>
      {termsModal}
      <NativeTabs
        tintColor="#E8590C"
        backgroundColor={isIOS26 ? undefined : c.surface}
        blurEffect={isIOS26 ? undefined : 'none'}
        disableTransparentOnScrollEdge={!isIOS26}
      >
        <NativeTabs.Trigger name="index">
          <NativeTabs.Trigger.Label>지도</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} md="map" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="list">
          <NativeTabs.Trigger.Label>장소</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} md="explore" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="mypage">
          <NativeTabs.Trigger.Label>마이</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} md="person" />
        </NativeTabs.Trigger>
      </NativeTabs>
    </>
  );
}
