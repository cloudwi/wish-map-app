import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useAuthStore } from '../../stores/authStore';
import { useEffect } from 'react';

export default function TabLayout() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <NativeTabs tintColor="#FF6B35">
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
