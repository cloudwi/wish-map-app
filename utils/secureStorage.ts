import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

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
    } catch (e) {
      console.warn(`[SecureStore] setItem failed for key "${key}":`, e);
    }
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch (e) {
    console.warn(`[SecureStore] getItem failed for key "${key}":`, e);
    return null;
  }
}

export async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(key);
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {}
  }
}
