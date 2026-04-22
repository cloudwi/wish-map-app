import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useEffect } from 'react';
import { TermsAgreementModal } from '../../components/TermsAgreementModal';

const isIOS26 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 19;

export default function TabLayout() {
  const { checkAuth, isAuthenticated, isLoading, hasAgreedToTerms, setTermsAgreed, logout } = useAuthStore();
  const c = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  const handleTermsCancel = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <>
    <TermsAgreementModal
      visible={isAuthenticated && !hasAgreedToTerms && !isLoading}
      onAgree={setTermsAgreed}
      onCancel={handleTermsCancel}
    />
    <NativeTabs
      tintColor="#E8590C"
      backgroundColor={isIOS26 ? undefined : c.surface}
      blurEffect={isIOS26 ? undefined : 'none'}
      disableTransparentOnScrollEdge={!isIOS26}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>지도</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'map', selected: 'map.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="list">
        <NativeTabs.Trigger.Label>장소</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'safari', selected: 'safari.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mypage">
        <NativeTabs.Trigger.Label>마이</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
    </>
  );
}
