import { Pressable, StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { SymbolView, SymbolViewProps } from 'expo-symbols';

interface GlassIconButtonProps {
  icon: SymbolViewProps['name'];
  onPress: () => void;
  size?: number;
  iconSize?: number;
  iconColor?: string;
  iconWeight?: SymbolViewProps['weight'];
  /** 기본값: size/2 (원형). 사각 버튼은 8~12 권장 */
  borderRadius?: number;
  /** Glass에 입힐 색상 틴트 (예: 브랜드 오렌지) */
  tintColor?: string;
  /** 폴백 배경 (iOS < 26 또는 glass 미작동 시) */
  fallbackBackground?: string;
  style?: StyleProp<ViewStyle>;
  hitSlop?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/**
 * Liquid Glass 아이콘 버튼.
 *
 * - iOS 26 실기기: GlassView가 진짜 Liquid Glass로 렌더
 * - iOS 26 시뮬레이터 / iOS < 26: `fallbackBackground` 폴백
 * - `borderRadius`로 원형/사각 모두 지원
 * - `tintColor`로 컬러드 글래스 (예: primary 오렌지)
 */
export function GlassIconButton({
  icon,
  onPress,
  size = 40,
  iconSize = 18,
  iconColor = 'rgba(60,60,67,0.9)',
  iconWeight = 'bold',
  borderRadius,
  tintColor,
  fallbackBackground = 'rgba(120,120,128,0.5)',
  style,
  hitSlop = 10,
  disabled,
  accessibilityLabel,
}: GlassIconButtonProps) {
  const supported = isLiquidGlassAvailable();

  const shape: ViewStyle = {
    width: size,
    height: size,
    borderRadius: borderRadius ?? size / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: tintColor ?? fallbackBackground,
  };

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.7 : 1 }]}
    >
      <View style={[shape, style]}>
        {supported && (
          <GlassView
            glassEffectStyle="regular"
            isInteractive
            tintColor={tintColor}
            style={StyleSheet.absoluteFill}
          />
        )}
        <SymbolView
          name={icon}
          size={iconSize}
          tintColor={iconColor}
          weight={iconWeight}
        />
      </View>
    </Pressable>
  );
}
