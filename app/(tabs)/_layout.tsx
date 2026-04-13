import { NativeTabs, Label, Icon } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useEffect } from 'react';
import { TermsAgreementModal } from '../../components/TermsAgreementModal';
import { KeyboardDoneBar } from '../../components/KeyboardDoneBar';

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
      backgroundColor={isIOS26 ? null : c.surface}
      blurEffect={isIOS26 ? undefined : 'none'}
      disableTransparentOnScrollEdge={!isIOS26}
    >
      <NativeTabs.Trigger name="index">
        <Label>지도</Label>
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="list">
        <Label>장소</Label>
        <Icon sf={{ default: 'safari', selected: 'safari.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="mypage">
        <Label>마이</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
    <KeyboardDoneBar />
    </>
  );
}
