import { Platform } from 'react-native';
import { apiClient } from '../api/client';

// 네이티브 모듈 사용 가능 여부 체크
let isNativeAvailable = false;
try {
  const { NativeModules } = require('react-native');
  isNativeAvailable = !!NativeModules.ExpoPushTokenManager;
} catch {}

export function setupNotificationHandler() {
  if (!isNativeAvailable) return;
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!isNativeAvailable) return null;
  try {
    const Device = require('expo-device');
    const Notifications = require('expo-notifications');

    if (!Device.isDevice) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return null;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '8fb1765b-9b9e-4dff-a01b-ceebec4dc209',
    });
    const token = tokenData.data;

    try { await apiClient.patch('/auth/me/push-token', { pushToken: token }); } catch {}

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }
    return token;
  } catch { return null; }
}

export function addNotificationResponseListener(callback: () => void) {
  if (!isNativeAvailable) return null;
  const Notifications = require('expo-notifications');
  return Notifications.addNotificationResponseReceivedListener(callback);
}
