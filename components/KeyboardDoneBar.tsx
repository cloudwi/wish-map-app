import { InputAccessoryView, View, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

export const KEYBOARD_DONE_ID = 'keyboard-done';

export function KeyboardDoneBar() {
  const c = useTheme();

  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={[styles.bar, { backgroundColor: c.headerBg, borderTopColor: c.border }]}>
        <TouchableOpacity onPress={Keyboard.dismiss} style={styles.btn} activeOpacity={0.7}>
          <Ionicons name="checkmark" size={24} color={c.primary} />
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 0.5,
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
