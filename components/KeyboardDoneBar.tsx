import { InputAccessoryView, View, TouchableOpacity, StyleSheet, Keyboard, Platform } from 'react-native';
import { SymbolView } from 'expo-symbols';

export const KEYBOARD_DONE_ID = 'keyboard-done';

export function KeyboardDoneBar() {
  if (Platform.OS !== 'ios') return null;

  return (
    <InputAccessoryView nativeID={KEYBOARD_DONE_ID}>
      <View style={styles.container}>
        <TouchableOpacity
          onPress={Keyboard.dismiss}
          activeOpacity={0.7}
          hitSlop={8}
        >
          <SymbolView
            name="xmark.circle.fill"
            size={32}
            tintColor="rgba(120,120,128,0.55)"
            weight="medium"
          />
        </TouchableOpacity>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 12,
    paddingBottom: 6,
  },
});
