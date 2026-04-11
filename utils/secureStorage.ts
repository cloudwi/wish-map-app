import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let warned = false;
// SecureStore 실패 시 메모리 fallback (시뮬레이터 코드 사이닝 없을 때)
const memoryStore = new Map<string, string>();

function warnOnce() {
  if (warned) return;
  warned = true;
  if (__DEV__) console.warn('[SecureStore] Keychain 접근 불가 — 메모리 fallback 사용 중 (시뮬레이터 한정, 프로덕션 정상)');
}

/**
 * SecureStore wrapper
 * - iOS/Android: expo-secure-store (암호화 저장)
 * - Web: localStorage (폴백)
 * - SecureStore 실패 시: 메모리 fallback (앱 재시작 시 초기화)
 */
export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      warnOnce();
      memoryStore.set(key, value);
    }
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    warnOnce();
    return memoryStore.get(key) ?? null;
  }
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      warnOnce();
      memoryStore.delete(key);
    }
  }
}
