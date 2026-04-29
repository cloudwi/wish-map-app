import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Tabs, router } from 'expo-router';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useEffect, useRef } from 'react';
import { TermsAgreementModal } from '../../components/TermsAgreementModal';

const isIOS26 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 19;

export default function TabLayout() {
  const { isAuthenticated, isLoading, hasAgreedToTerms, isCheckingTerms, setTermsAgreed, logout, hasSeenTutorial } = useAuthStore();
  const c = useTheme();
  const insets = useSafeAreaInsets();

  // checkAuth 는 root layout 에서 1회 실행 — 여기서 또 부르면 isLoading 이 다시 true 로 떨어지면서
  // showTutorial 이 깜빡(true→false→true)거려 튜토리얼이 두 번 push 되는 버그가 있었음.

  const handleTermsCancel = async () => {
    await logout();
    router.replace('/login');
  };

  // 인증·약관 체크가 끝난 로그인 사용자에게만 약관/튜토리얼이 의미 있음
  const isReady = isAuthenticated && !isLoading && !isCheckingTerms;
  const showTerms = isReady && !hasAgreedToTerms;
  const showTutorial = isReady && hasAgreedToTerms && !hasSeenTutorial;

  // 튜토리얼은 별도 라우트(/tutorial)로 띄움. 한 세션 내 1회만 push.
  // 로그아웃 → 다른 계정 로그인 케이스를 위해 isAuthenticated 가 false 로 바뀔 때만 ref 리셋.
  const tutorialPushedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated) tutorialPushedRef.current = false;
  }, [isAuthenticated]);
  useEffect(() => {
    if (showTutorial && !tutorialPushedRef.current) {
      tutorialPushedRef.current = true;
      router.push('/tutorial');
    }
  }, [showTutorial]);

  const termsModal = (
    <TermsAgreementModal visible={showTerms} onAgree={setTermsAgreed} onCancel={handleTermsCancel} />
  );

  // Android: JS 기반 커스텀 탭바. 해외 서비스 스타일(미니멀, 얇은 상단 디바이더, 라운드 느낌 없음).
  if (Platform.OS === 'android') {
    // edge-to-edge 환경에서 시스템 바(3-button ~48dp / 제스처 ~24dp)와 겹치지 않도록 inset 만큼 패딩.
    // inset 이 정상 보고되면 그 값을 쓰고, 0 이거나 비정상적으로 작은 디바이스 케이스는 48dp 로 보호.
    const bottomInset = insets.bottom >= 16 ? insets.bottom : 48;
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
              height: 56 + bottomInset,
              paddingTop: 6,
              paddingBottom: 6 + bottomInset,
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
