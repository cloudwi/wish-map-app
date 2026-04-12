import { InputAccessoryView, View, TouchableOpacity, StyleSheet, Keyboard, Platform, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const KEYBOARD_DONE_ID = 'keyboard-done';

export function KeyboardDoneBar() {
  const scheme = useColorScheme();

  if (Platform.OS !== 'ios') return null;

  const bgColor = scheme === 'dark' ? '#2C2C2E' : '#D1D3D9';

  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <TouchableOpacity
          onPress={Keyboard.dismiss}
          style={styles.bubble}
          activeOpacity={0.8}
        >
          <Ionicons name="checkmark" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
