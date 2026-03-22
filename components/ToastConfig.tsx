import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BaseToastProps } from 'react-native-toast-message';
import { themes } from '../constants/theme';

const config: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { icon: 'checkmark-circle', color: '#2E7D32' },
  error: { icon: 'alert-circle', color: '#C62828' },
  info: { icon: 'information-circle', color: '#E65100' },
};

function ToastBase({ type, text1, text2 }: BaseToastProps & { type: string }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? themes.dark : themes.light;
  const t = config[type] || config.info;
  const bgColor = isDark ? c.cardBg : c.surface;

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor: c.border }]}>
      <Ionicons name={t.icon} size={22} color={t.color} />
      <View style={styles.textWrap}>
        {text1 ? <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={1}>{text1}</Text> : null}
        {text2 ? <Text style={[styles.message, { color: c.textSecondary }]} numberOfLines={3}>{text2}</Text> : null}
      </View>
    </View>
  );
}

export const toastConfig = {
  success: (props: BaseToastProps) => <ToastBase {...props} type="success" />,
  error: (props: BaseToastProps) => <ToastBase {...props} type="error" />,
  info: (props: BaseToastProps) => <ToastBase {...props} type="info" />,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    borderRadius: 10,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 4,
  },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  message: { fontSize: 13, marginTop: 3, lineHeight: 18 },
});
