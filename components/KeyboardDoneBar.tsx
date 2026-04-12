import { InputAccessoryView, View, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export const KEYBOARD_DONE_ID = 'keyboard-done';

export function KeyboardDoneBar() {
  const c = useTheme();

  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={Keyboard.dismiss}
          style={[styles.bubble, { backgroundColor: '#007AFF' }]}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});
