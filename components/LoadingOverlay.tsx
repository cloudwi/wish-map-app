import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing, typography } from '../constants/theme';

interface LoadingOverlayProps {
  /** 전체 화면을 덮는 오버레이 (absolute positioning). 기본 false */
  fullscreen?: boolean;
  /** 스피너 크기 */
  size?: 'small' | 'large';
  /** 하단 텍스트 (선택) */
  message?: string;
}

/**
 * 로딩 인디케이터 공용 컴포넌트.
 * - `fullscreen`: 반투명 배경 위에 스피너 표시
 * - 일반: 중앙에 스피너만 표시
 */
export function LoadingOverlay({ fullscreen, size = 'large', message }: LoadingOverlayProps) {
  const c = useTheme();

  if (fullscreen) {
    return (
      <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: c.loadingOverlay }]}>
        <ActivityIndicator size={size} color={c.primary} />
        {message && <Text style={[styles.message, { color: c.textSecondary }]}>{message}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={c.primary} />
      {message && <Text style={[styles.message, { color: c.textSecondary }]}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  inline: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  message: {
    ...typography.caption1,
    marginTop: spacing.sm,
  },
});
