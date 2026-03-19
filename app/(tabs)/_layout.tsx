import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';
import { useAuthStore } from '../../stores/authStore';
import { useTheme } from '../../hooks/useTheme';
import { useEffect } from 'react';

const isIOS26 = Platform.OS === 'ios' && parseInt(Platform.Version as string, 10) >= 19;

export default function TabLayout() {
  const { checkAuth } = useAuthStore();
  const c = useTheme();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <NativeTabs
      tintColor="#FF6B35"
      backgroundColor={isIOS26 ? null : c.surface}
      blurEffect={isIOS26 ? undefined : 'none'}
      disableTransparentOnScrollEdge={!isIOS26}
    >
      <NativeTabs.Trigger name="index">
        <Label>지도</Label>
        <Icon sf={{ default: 'map', selected: 'map.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="list">
        <Label>맛집</Label>
        <Icon sf={{ default: 'safari', selected: 'safari.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="suggest" hidden />

      <NativeTabs.Trigger name="mypage">
        <Label>마이</Label>
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
