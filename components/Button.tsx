import { TouchableOpacity, Text, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { radius } from '../constants/theme';
import { lightTap } from '../utils/haptics';

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: Size;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

/**
 * 앱 표준 버튼.
 * - `primary`: 브랜드 오렌지 (기본)
 * - `secondary`: 보더 + 중립색 텍스트
 * - `destructive`: 빨강 (삭제/탈퇴 등)
 * - `ghost`: 배경 없이 텍스트만
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  fullWidth,
  size = 'md',
  style,
  haptic = true,
}: ButtonProps) {
  const c = useTheme();

  const handlePress = () => {
    if (loading || disabled) return;
    if (haptic) lightTap();
    onPress();
  };

  const { bg, fg, border } = (() => {
    switch (variant) {
      case 'primary':
        return { bg: c.primary, fg: c.textWhite, border: 'transparent' };
      case 'destructive':
        return { bg: c.error, fg: c.textWhite, border: 'transparent' };
      case 'secondary':
        return { bg: c.surface, fg: c.textPrimary, border: c.border };
      case 'ghost':
        return { bg: 'transparent', fg: c.textPrimary, border: 'transparent' };
    }
  })();

  const dims = (() => {
    switch (size) {
      case 'sm':
        return { paddingV: 8, paddingH: 12, fontSize: 13, iconSize: 14 };
      case 'lg':
        return { paddingV: 16, paddingH: 24, fontSize: 16, iconSize: 18 };
      default:
        return { paddingV: 12, paddingH: 16, fontSize: 15, iconSize: 16 };
    }
  })();

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={loading || disabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          paddingVertical: dims.paddingV,
          paddingHorizontal: dims.paddingH,
          borderRadius: radius.lg,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={dims.iconSize} color={fg} />}
          <Text style={{ color: fg, fontSize: dims.fontSize, fontWeight: '600' }}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
