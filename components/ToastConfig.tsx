import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BaseToastProps } from 'react-native-toast-message';

const icons: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
  success: { name: 'checkmark-circle', color: '#4CAF50' },
  error: { name: 'close-circle', color: '#F44336' },
  info: { name: 'information-circle', color: '#FF6B35' },
};

function ToastBase({ type, text1, text2 }: BaseToastProps & { type: string }) {
  const icon = icons[type] || icons.info;
  return (
    <View style={styles.container}>
      <View style={[styles.accent, { backgroundColor: icon.color }]} />
      <Ionicons name={icon.name} size={22} color={icon.color} style={styles.icon} />
      <View style={styles.textWrap}>
        {text1 ? <Text style={styles.title} numberOfLines={1}>{text1}</Text> : null}
        {text2 ? <Text style={styles.message} numberOfLines={2}>{text2}</Text> : null}
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
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  accent: { width: 4, alignSelf: 'stretch', borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  icon: { marginLeft: 12, marginRight: 10 },
  textWrap: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: '#333' },
  message: { fontSize: 12, color: '#888', marginTop: 2 },
});
