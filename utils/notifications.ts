import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { apiClient } from '../api/client';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '모임 소식',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return null;
    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: '8fb1765b-9b9e-4dff-a01b-ceebec4dc209',
    });
    await apiClient.patch('/auth/me/push-token', { pushToken: token });
    return token;
  } catch {
    return null;
  }
}

export function addNotificationResponseListener(callback: () => void) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
