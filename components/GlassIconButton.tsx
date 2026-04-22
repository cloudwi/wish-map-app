import { Pressable, StyleSheet, View, ViewStyle, StyleProp, Platform } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { BlurView } from 'expo-blur';
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
 * Liquid Glass 아이콘 버튼. 3단 레이어로 플랫폼별 최적 효과:
 * 1. `fallbackBackground` (항상) — 최소 가시성 보장
 * 2. `BlurView` (iOS 전체) — 시뮬레이터/구버전 iOS에서 glass 느낌
 * 3. `GlassView` (iOS 26+) — 진짜 Liquid Glass (실기기에서 가장 선명)
 */
export function GlassIconButton({
  icon,
  onPress,
  size = 40,
  iconSize = 18,
  iconColor = 'rgba(28,28,30,1)',
  iconWeight = 'bold',
  borderRadius,
  tintColor,
  fallbackBackground = 'rgba(120,120,128,0.25)',
  style,
  hitSlop = 10,
  disabled,
  accessibilityLabel,
}: GlassIconButtonProps) {
  const supported = isLiquidGlassAvailable();
  const isIOS = Platform.OS === 'ios';

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
        {isIOS && !tintColor && (
          <BlurView
            intensity={60}
            tint="systemChromeMaterial"
            style={StyleSheet.absoluteFill}
          />
        )}
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
