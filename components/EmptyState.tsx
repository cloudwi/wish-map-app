import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { spacing, typography } from '../constants/theme';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

/**
 * 리스트/화면 비어있을 때 표시하는 공용 empty state.
 * icon + title + 설명 + 선택적 CTA.
 */
export function EmptyState({ icon, title, description, actionLabel, onAction, style }: EmptyStateProps) {
  const c = useTheme();

  return (
    <View style={[styles.container, style]}>
      {icon && (
        <Ionicons name={icon} size={48} color={c.textTertiary} style={styles.icon} />
      )}
      <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      {description && (
        <Text style={[styles.description, { color: c.textSecondary }]}>{description}</Text>
      )}
      {actionLabel && onAction && (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  icon: {
    marginBottom: spacing.md,
    opacity: 0.6,
  },
  title: {
    ...typography.body1Bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    ...typography.body3,
    textAlign: 'center',
  },
  action: {
    marginTop: spacing.xl,
  },
});
