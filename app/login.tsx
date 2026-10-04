import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { getErrorMessage } from '../utils/getErrorMessage';
import { Button, Field, Heading, Notice, Page, Panel, ui } from '../components/ServiceUI';

export default function LoginScreen() {
  const c = useTheme();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const login = useAuthStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expires, setExpires] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const cooldownUntil = useRef(0);
  const codeExpiresAt = useRef(0);

  useEffect(() => {
    const tick = () => {
      setCooldown(Math.max(0, Math.ceil((cooldownUntil.current - Date.now()) / 1000)));
      setExpires(Math.max(0, Math.ceil((codeExpiresAt.current - Date.now()) / 1000)));
    };
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);

  const requestCode = async () => {
    if (inFlight.current || Date.now() < cooldownUntil.current) return;
    const normalized = phone.replace(/\D/g, '');
    if (!/^010\d{8}$/.test(normalized)) return setError('010으로 시작하는 11자리 휴대폰 번호를 입력해주세요.');
    inFlight.current = true; setBusy(true); setError('');
    try {
      await authApi.requestPhoneCode(normalized);
      setPhone(normalized); setSent(true); setCode('');
      cooldownUntil.current = Date.now() + 60000;
      codeExpiresAt.current = Date.now() + 300000;
      setCooldown(60); setExpires(300);
    } catch (e) { setError(getErrorMessage(e, '인증 문자를 보내지 못했어요.')); }
    finally { inFlight.current = false; setBusy(false); }
  };

  const verifyCode = async () => {
    if (inFlight.current) return;
    if (!/^\d{6}$/.test(code)) return setError('문자로 받은 6자리 인증번호를 입력해주세요.');
    if (expires === 0) return setError('인증번호가 만료됐어요. 새 인증번호를 받아주세요.');
    inFlight.current = true; setBusy(true); setError('');
    try {
      await login(phone, code);
      if (redirect === '/party/create') router.replace('/party/create');
      else if (redirect && /^\/party\/\d+$/.test(redirect)) router.replace(`/party/${Number(redirect.split('/').at(-1))}`);
      else router.replace('/(tabs)');
    } catch (e) { setError(getErrorMessage(e, '인증번호를 확인해주세요.')); }
    finally { inFlight.current = false; setBusy(false); }
  };

  return <Page>
    <Stack.Screen options={{ title: '시작하기' }} />
    <View style={{ paddingTop: 16 }}><Ionicons name="chatbubble-ellipses-outline" size={36} color={c.primary} /></View>
    <Heading title="함께할 준비가 됐나요?" subtitle="휴대폰 번호로 간편하게 시작해요. 파티 구경은 로그인 없이도 가능해요." />
    <Panel>
      <Field label="휴대폰 번호" placeholder="010 1234 5678" keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel"
        value={phone} maxLength={13} editable={!busy && !sent} onChangeText={(value) => { setPhone(value); setError(''); }} />
      {sent && <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setSent(false); setCode(''); setError(''); }} style={{ minHeight: 44, justifyContent: 'center' }}>
        <Text style={{ color: c.primary, fontWeight: '600' }}>다른 번호로 인증하기</Text>
      </Pressable>}
      {sent && <>
        <Field label="인증번호" placeholder="6자리 인증번호" keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp"
          value={code} onChangeText={(value) => setCode(value.replace(/\D/g, ''))} maxLength={6} editable={!busy} onSubmitEditing={() => void verifyCode()} />
        <Text accessibilityLiveRegion="polite" style={[ui.caption, { color: expires ? c.textSecondary : c.error }]}>
          {expires ? `유효 시간 ${Math.floor(expires / 60)}:${String(expires % 60).padStart(2, '0')}` : '인증번호가 만료됐어요. 다시 받아주세요.'}
        </Text>
      </>}
      <Notice message={error} />
      {sent && <Button label="인증하고 시작하기" onPress={() => void verifyCode()} busy={busy} disabled={expires === 0 || code.length !== 6} />}
      <Button label={cooldown > 0 ? `${cooldown}초 뒤 재전송` : sent ? '인증번호 재전송' : '인증번호 받기'} onPress={() => void requestCode()}
        busy={busy && !sent} disabled={busy || cooldown > 0} secondary={sent} />
    </Panel>
    <Button label="로그인 없이 둘러보기" onPress={() => router.replace('/(tabs)')} secondary />
    <Text style={[ui.caption, { color: c.textSecondary, textAlign: 'center' }]}>첫 로그인 후 이용약관을 확인하고 동의해주세요.</Text>
    <View style={[ui.row, { justifyContent: 'center' }]}>
      <Pressable accessibilityRole="link" onPress={() => router.push('/legal/terms')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.textSecondary }}>이용약관</Text></Pressable>
      <Text style={{ color: c.border }}>·</Text>
      <Pressable accessibilityRole="link" onPress={() => router.push('/legal/privacy')} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ color: c.textSecondary }}>개인정보처리방침</Text></Pressable>
    </View>
  </Page>;
}
