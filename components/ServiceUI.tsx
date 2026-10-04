import { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';

export function Page({ children, safeTop = false }: { children: ReactNode; safeTop?: boolean }) {
  const c = useTheme();
  return <SafeAreaView edges={safeTop ? ['top', 'bottom'] : ['bottom']} style={{ flex: 1, backgroundColor: c.background }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.page}>{children}</ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  const c = useTheme();
  return <View style={{ gap: 8, paddingVertical: 8 }}>
    <Text style={[ui.heading, { color: c.textPrimary }]}>{title}</Text>
    {subtitle && <Text style={[ui.body, { color: c.textSecondary }]}>{subtitle}</Text>}
  </View>;
}

export function Panel({ children }: { children: ReactNode }) {
  const c = useTheme();
  return <View style={[ui.panel, { backgroundColor: c.cardBg, borderColor: c.border }]}>{children}</View>;
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  const c = useTheme();
  return <View style={{ gap: 8 }}>
    <Text style={[ui.label, { color: c.textPrimary }]}>{label}</Text>
    <TextInput {...props} accessibilityLabel={props.accessibilityLabel || label} placeholderTextColor={c.textSecondary}
      style={[ui.input, { color: c.textPrimary, borderColor: c.border, backgroundColor: c.inputBg }, props.multiline && { minHeight: 120, textAlignVertical: 'top' }, props.style]} />
    {hint && <Text style={[ui.caption, { color: c.textSecondary }]}>{hint}</Text>}
  </View>;
}

export function Button({ label, accessibilityLabel, onPress, busy = false, disabled = false, secondary = false, destructive = false }: {
  label: string; accessibilityLabel?: string; onPress: () => void; busy?: boolean; disabled?: boolean; secondary?: boolean; destructive?: boolean;
}) {
  const c = useTheme();
  const color = destructive ? c.error : c.primary;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel || label} accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={disabled || busy} onPress={onPress} style={({ pressed }) => [ui.button, {
      backgroundColor: secondary ? c.cardBg : color, borderColor: secondary ? c.border : color,
      opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1,
    }]}>
    {busy && <ActivityIndicator color={secondary ? color : 'white'} />}
    <Text style={{ fontSize: 15, fontWeight: '700', color: secondary ? color : 'white' }}>{label}</Text>
  </Pressable>;
}

export function Notice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useTheme();
  if (!message) return null;
  return <View accessibilityRole="alert" style={[ui.notice, { backgroundColor: c.errorBg }]}>
    <Text style={[ui.body, { color: c.error }]}>{message}</Text>
    {onRetry && <Button label="다시 시도" onPress={onRetry} secondary />}
  </View>;
}

export const ui = StyleSheet.create({
  page: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: 20, paddingBottom: 40, gap: 18, flexGrow: 1 },
  panel: { padding: 20, borderWidth: 1, borderRadius: 20, gap: 16 },
  heading: { fontSize: 27, lineHeight: 36, fontWeight: '800', letterSpacing: -0.7 },
  label: { fontSize: 16, fontWeight: '700', lineHeight: 23 },
  body: { fontSize: 14, lineHeight: 22 },
  caption: { fontSize: 12, lineHeight: 19 },
  input: { minHeight: 52, padding: 14, borderWidth: 1, borderRadius: 14, fontSize: 16 },
  button: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  notice: { padding: 16, borderRadius: 14, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
