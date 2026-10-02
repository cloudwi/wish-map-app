import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { reportApi, ReportReason, ReportTargetType } from '../api/report';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { getErrorMessage } from '../utils/getErrorMessage';

const reasons: { id: ReportReason; label: string }[] = [
  { id: 'SPAM', label: '광고·스팸' },
  { id: 'INAPPROPRIATE', label: '부적절한 내용' },
  { id: 'FALSE_INFO', label: '허위 정보' },
  { id: 'OTHER', label: '기타' },
];

export default function ReportScreen() {
  const c = useTheme();
  const { targetType, targetId } = useLocalSearchParams<{ targetType: ReportTargetType; targetId: string }>();
  const user = useAuthStore((s) => s.user);
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    try {
      setBusy(true); setError('');
      await reportApi.create({ targetType, targetId: Number(targetId), reason, description: description.trim() });
      router.back();
    } catch (e) { setError(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  return <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.page}>
    <Stack.Screen options={{ title: '신고하기' }} />
    {!user ? <Pressable onPress={() => router.replace('/login')}><Text style={{ color: c.primary }}>로그인 후 신고할 수 있어요. 로그인하기</Text></Pressable> : <>
      <Text style={[styles.heading, { color: c.textPrimary }]}>어떤 문제가 있나요?</Text>
      {reasons.map((item) => <Pressable key={item.id} onPress={() => setReason(item.id)}
        style={[styles.reason, { borderColor: reason === item.id ? c.primary : c.border }]}>
        <Text style={{ color: c.textPrimary }}>{item.label}</Text>
      </Pressable>)}
      <TextInput placeholder="상황을 알려주세요 (선택)" multiline value={description} onChangeText={setDescription}
        style={[styles.input, { borderColor: c.border, color: c.textPrimary }]} />
      {error ? <Text style={{ color: c.error }}>{error}</Text> : null}
      <Pressable disabled={busy} onPress={submit} style={[styles.button, { backgroundColor: c.primary, opacity: busy ? 0.5 : 1 }]}>
        <Text style={{ color: 'white', fontWeight: '700' }}>신고 접수</Text>
      </Pressable>
    </>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { padding: 24, paddingBottom: 50 },
  heading: { fontSize: 21, fontWeight: '700', marginBottom: 20 },
  reason: { borderWidth: 1, borderRadius: 10, padding: 15, marginBottom: 10 },
  input: { borderWidth: 1, borderRadius: 10, padding: 15, minHeight: 110, textAlignVertical: 'top', marginTop: 12 },
  button: { height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
});
