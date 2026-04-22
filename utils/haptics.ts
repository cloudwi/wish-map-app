import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const noop = () => {};

export const lightTap = Platform.OS === 'web'
  ? noop
  : () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

export const mediumTap = Platform.OS === 'web'
  ? noop
  : () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

export const successTap = Platform.OS === 'web'
  ? noop
  : () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
