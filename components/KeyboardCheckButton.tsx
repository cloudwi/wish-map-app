import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, Keyboard, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function KeyboardCheckButton() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const showSub = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
    const hideSub = Keyboard.addListener('keyboardWillHide', () => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
        setKeyboardHeight(0);
      });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  if (Platform.OS !== 'ios' || keyboardHeight === 0) return null;

  return (
    <Animated.View style={[styles.container, { bottom: keyboardHeight + 8, opacity }]}>
      <TouchableOpacity onPress={Keyboard.dismiss} style={styles.bubble} activeOpacity={0.8}>
        <Ionicons name="checkmark" size={18} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 12,
    zIndex: 999,
  },
  bubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
