import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BaseToastProps } from 'react-native-toast-message';
import { themes } from '../constants/theme';

const config: Record<string, { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }> = {
  success: { icon: 'checkmark-circle', bg: '#E8F5E9', color: '#2E7D32' },
  error: { icon: 'alert-circle', bg: '#FBE9E7', color: '#C62828' },
  info: { icon: 'information-circle', bg: '#FFF3E0', color: '#E65100' },
};

function ToastBase({ type, text1, text2 }: BaseToastProps & { type: string }) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const c = isDark ? themes.dark : themes.light;
  const t = config[type] || config.info;
  const bgColor = isDark ? c.cardBg : t.bg;
  const iconColor = isDark ? t.color : t.color;

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor: isDark ? t.color + '30' : t.color + '20' }]}>
      <View style={[styles.iconWrap, { backgroundColor: t.color + '15' }]}>
        <Ionicons name={t.icon} size={22} color={iconColor} />
      </View>
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
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20 },
  message: { fontSize: 13, marginTop: 3, lineHeight: 18 },
});
