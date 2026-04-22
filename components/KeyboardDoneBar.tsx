import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Keyboard, Platform, Animated } from 'react-native';
import { GlassIconButton } from './GlassIconButton';
import { useAppStore } from '../stores/appStore';

// inputAccessoryViewID 하위 호환용 (TextInput prop으로 넘겨도 무시되므로 안전).
export const KEYBOARD_DONE_ID = 'keyboard-done';

/**
 * 키보드 위에 플로팅 X 버튼을 띄우는 공용 컴포넌트.
 * - `Keyboard` 이벤트 리스너로 직접 위치 제어 (InputAccessoryView 대체)
 * - New Architecture(Fabric)에서도 안정적으로 렌더
 * - RootLayout에 1회만 렌더하면 앱 전역에서 동작
 */
export function KeyboardDoneBar() {
  const [height, setHeight] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const suppressed = useAppStore((s) => s.suppressKeyboardDoneBar);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const show = Keyboard.addListener('keyboardWillShow', (e) => {
      setHeight(e.endCoordinates.height);
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(
        ({ finished }) => { if (finished) setHeight(0); }
      );
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [opacity]);

  if (Platform.OS !== 'ios' || height === 0 || suppressed) return null;

  return (
    <Animated.View style={[styles.container, { bottom: height + 8, opacity }]} pointerEvents="box-none">
      <GlassIconButton
        icon="xmark"
        onPress={Keyboard.dismiss}
        accessibilityLabel="키보드 닫기"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 14,
    zIndex: 9999,
  },
});
