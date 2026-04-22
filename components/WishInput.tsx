import { forwardRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../hooks/useTheme';

/**
 * 앱 전역 표준 TextInput.
 *
 * 기본 동작(지도 검색바 기준):
 * - QuickType 자동완성 바 / 자동수정 / 대문자화 / 철자검사 비활성화
 * - 테마 기반 텍스트/플레이스홀더 색상
 *
 * 키보드 위 X 닫기 버튼은 `KeyboardDoneBar`가 전역에서 플로팅으로 띄움.
 * 모든 prop은 TextInput props 그대로 override 가능.
 */
export const WishInput = forwardRef<TextInput, TextInputProps>(
  ({ style, placeholderTextColor, ...props }, ref) => {
    const c = useTheme();

    return (
      <TextInput
        ref={ref}
        autoCorrect={false}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        textContentType="oneTimeCode"
        placeholderTextColor={placeholderTextColor ?? c.textSecondary}
        style={[{ color: c.textPrimary }, style]}
        {...props}
      />
    );
  }
);

WishInput.displayName = 'WishInput';
