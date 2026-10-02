import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function LoginScreen() {
  const c = useTheme();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async () => {
    const normalized = phone.replace(/-/g, '').trim();
    if (!/^010\d{8}$/.test(normalized)) return setError('010으로 시작하는 휴대폰 번호를 입력해주세요.');
    try {
      setBusy(true); setError('');
      await authApi.requestPhoneCode(normalized);
      setPhone(normalized);
      setSent(true);
      setCooldown(60);
    } catch (e) { setError(getErrorMessage(e, '인증 문자를 보내지 못했어요.')); }
    finally { setBusy(false); }
  };

  const verifyCode = async () => {
    if (!/^\d{6}$/.test(code)) return setError('6자리 인증번호를 입력해주세요.');
    try {
      setBusy(true); setError('');
      await login(phone, code);
      router.replace('/(tabs)');
    } catch (e) { setError(getErrorMessage(e, '인증번호를 확인해주세요.')); }
    finally { setBusy(false); }
  };

  return <View style={[styles.page, { backgroundColor: c.background }]}>
    <Stack.Screen options={{ title: '휴대폰 인증 로그인' }} />
    <Text style={[styles.heading, { color: c.textPrimary }]}>휴대폰 번호로 시작해요</Text>
    <Text style={[styles.description, { color: c.textSecondary }]}>파티를 둘러보는 건 로그인 없이도 가능해요.</Text>
    <Text style={[styles.label, { color: c.textPrimary }]}>휴대폰 번호</Text>
    <TextInput accessibilityLabel="휴대폰 번호" placeholder="01012345678" keyboardType="phone-pad"
      textContentType="telephoneNumber" autoComplete="tel" value={phone} onChangeText={(value) => { setPhone(value); setSent(false); setCode(''); }}
      maxLength={13} style={[styles.input, { borderColor: c.border, color: c.textPrimary }]} />
    <Action label={sent ? (cooldown > 0 ? `${cooldown}초 뒤 재전송` : '인증번호 재전송') : '인증번호 받기'}
      disabled={busy || cooldown > 0} onPress={requestCode} color={c.primary} />
    {sent && <>
      <Text style={[styles.label, { color: c.textPrimary }]}>인증번호</Text>
      <TextInput accessibilityLabel="인증번호" placeholder="6자리 인증번호" keyboardType="number-pad"
        textContentType="oneTimeCode" autoComplete="sms-otp" value={code} onChangeText={setCode}
        maxLength={6} style={[styles.input, { borderColor: c.border, color: c.textPrimary }]} />
      <Text style={{ color: c.textSecondary }}>인증번호는 5분 동안 유효해요.</Text>
      <Action label="인증하고 시작하기" disabled={busy} onPress={verifyCode} color={c.primary} />
    </>}
    {busy && <ActivityIndicator color={c.primary} style={{ marginTop: 14 }} />}
    {error ? <Text style={{ color: c.error, marginTop: 14 }}>{error}</Text> : null}
    <Pressable onPress={() => router.replace('/(tabs)')} style={{ marginTop: 30 }}>
      <Text style={{ color: c.primary }}>로그인 없이 둘러보기</Text>
    </Pressable>
    <Text style={[styles.terms, { color: c.textSecondary }]}>
      로그인 시 <Text style={{ color: c.primary }} onPress={() => router.push('/legal/terms')}>이용약관</Text> 및{' '}
      <Text style={{ color: c.primary }} onPress={() => router.push('/legal/privacy')}>개인정보처리방침</Text>에 동의합니다.
    </Text>
  </View>;
}

function Action({ label, disabled, onPress, color }: { label: string; disabled: boolean; onPress: () => void; color: string }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress}
    style={[styles.button, { backgroundColor: color, opacity: disabled ? 0.5 : 1 }]}>
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  page: { flex: 1, padding: 28, justifyContent: 'center' },
  heading: { fontSize: 25, fontWeight: '700', marginBottom: 9 },
  description: { fontSize: 15, marginBottom: 30 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 17 },
  button: { marginTop: 14, minHeight: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '700' },
  terms: { fontSize: 12, lineHeight: 18, marginTop: 28, textAlign: 'center' },
});
