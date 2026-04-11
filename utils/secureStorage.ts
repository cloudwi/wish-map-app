import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const warnedKeys = new Set<string>();

function warnOnce(key: string, op: string) {
  const id = `${op}:${key}`;
  if (warnedKeys.has(id)) return;
  warnedKeys.add(id);
  console.warn(`[SecureStore] ${op} unavailable (keychain access denied)`);
}

/**
 * SecureStore wrapper
 * - iOS/Android: expo-secure-store (암호화 저장)
 * - Web: localStorage (폴백)
 */
export async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, value);
  } else {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      warnOnce(key, 'setItem');
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
    warnOnce(key, 'getItem');
    return null;
  }
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      warnOnce(key, 'deleteItem');
    }
  }
}
