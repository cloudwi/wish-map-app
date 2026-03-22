import { Platform } from 'react-native';
import { apiClient } from '../api/client';

let _N: typeof import('expo-notifications') | null = null;
let _D: typeof import('expo-device') | null = null;

async function getModules() {
  if (_N && _D) return { N: _N, D: _D };
  try {
    const [N, D] = await Promise.all([
      import('expo-notifications'),
      import('expo-device'),
    ]);
    _N = N;
    _D = D;
    return { N, D };
  } catch {
    return null;
  }
}

// 앱이 포그라운드에 있을 때도 알림 표시
export async function setupNotificationHandler() {
  const mods = await getModules();
  if (!mods) return;
  const { N } = mods;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// 푸시 토큰 발급 + 서버에 저장
export async function registerForPushNotifications(): Promise<string | null> {
  const mods = await getModules();
  if (!mods) return null;
  const { N, D } = mods;

  if (!D.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // 권한 요청
  const { status: existingStatus } = await N.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Expo Push Token 발급
  const tokenData = await N.getExpoPushTokenAsync({
    projectId: '8fb1765b-9b9e-4dff-a01b-ceebec4dc209',
  });
  const token = tokenData.data;

  // 서버에 토큰 저장
  try {
    await apiClient.patch('/auth/me/push-token', { pushToken: token });
  } catch (error) {
    console.error('Failed to save push token:', error);
  }

  // Android 채널 설정
  if (Platform.OS === 'android') {
    await N.setNotificationChannelAsync('default', {
      name: 'default',
      importance: N.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  return token;
}

// 알림 탭 리스너 등록
export async function addNotificationResponseListener(callback: () => void) {
  const mods = await getModules();
  if (!mods) return null;
  const { N } = mods;
  return N.addNotificationResponseReceivedListener(callback);
}
