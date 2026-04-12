import { InputAccessoryView, View, TouchableOpacity, Text, StyleSheet, Keyboard, Platform, useColorScheme } from 'react-native';

export const KEYBOARD_DONE_ID = 'keyboard-done';

export function KeyboardDoneBar() {
  const scheme = useColorScheme();

  if (Platform.OS !== 'ios') return null;

  const bgColor = scheme === 'dark' ? '#1C1C1E' : '#D1D3D9';

  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={[styles.bar, { backgroundColor: bgColor }]}>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={Keyboard.dismiss} style={styles.btn} activeOpacity={0.7}>
          <Text style={styles.btnText}>완료</Text>
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.3)',
  },
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  btnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
});
