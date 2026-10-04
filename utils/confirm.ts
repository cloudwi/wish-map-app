import { Alert, Platform } from 'react-native';

export function confirmAction(title: string, message: string, action = '확인', destructive = false): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`));
  return new Promise((resolve) => Alert.alert(title, message, [
    { text: '취소', style: 'cancel', onPress: () => resolve(false) },
    { text: action, style: destructive ? 'destructive' : 'default', onPress: () => resolve(true) },
  ], { cancelable: true, onDismiss: () => resolve(false) }));
}
