import { useRef, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { reportApi, ReportReason, ReportTargetType } from '../api/report';
import { useAuthStore } from '../stores/authStore';
import { useTheme } from '../hooks/useTheme';
import { getErrorMessage } from '../utils/getErrorMessage';
import { Button, Field, Heading, Notice, Page, Panel, ui } from '../components/ServiceUI';

const reasons: { id: ReportReason; label: string }[] = [{ id: 'SPAM', label: '광고·스팸' }, { id: 'INAPPROPRIATE', label: '부적절한 내용' }, { id: 'FALSE_INFO', label: '허위 정보' }, { id: 'OTHER', label: '기타' }];

export default function ReportScreen() {
  const c = useTheme();
  const { targetType, targetId } = useLocalSearchParams<{ targetType: ReportTargetType; targetId: string }>();
  const user = useAuthStore((s) => s.user);
  const [reason, setReason] = useState<ReportReason>('INAPPROPRIATE');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const submitting = useRef(false);
  const valid = ['PARTY', 'USER'].includes(targetType) && Number.isSafeInteger(Number(targetId)) && Number(targetId) > 0;
  const submit = async () => {
    if (submitting.current || !valid) return;
    submitting.current = true; setBusy(true); setError('');
    try { await reportApi.create({ targetType, targetId: Number(targetId), reason, description: description.trim() }); setDone(true); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { submitting.current = false; setBusy(false); }
  };
  return <Page><Stack.Screen options={{ title: '신고하기' }} />
    <Heading title={done ? '신고를 접수했어요' : '어떤 문제가 있나요?'} subtitle={done ? '접수한 내용을 확인하고 필요한 조치를 취하겠습니다.' : '모두가 안심하고 함께할 수 있도록 알려주세요.'} />
    {done ? <Button label="파티로 돌아가기" onPress={() => router.back()} /> : !valid ? <Notice message="신고할 대상이 올바르지 않아요. 파티에서 다시 시도해주세요." /> : !user ? <Button label="로그인 후 신고하기" onPress={() => router.replace('/login')} /> : <>
      <Panel>{reasons.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityLabel={item.label} accessibilityState={{ checked: reason === item.id }} disabled={busy} onPress={() => setReason(item.id)}
        style={{ minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, borderWidth: 1, borderRadius: 14, borderColor: reason === item.id ? c.primary : c.border, backgroundColor: reason === item.id ? c.primaryBg : c.cardBg }}>
        <Text style={{ color: reason === item.id ? c.primary : c.textPrimary }}>{item.label}</Text></Pressable>)}
        <Field label="상황 설명 (선택)" placeholder="어떤 일이 있었는지 알려주세요." multiline value={description} onChangeText={setDescription} maxLength={1000} editable={!busy} hint={`${description.length}/1000`} />
      </Panel><Notice message={error} /><Button label="신고 접수" onPress={() => void submit()} busy={busy} />
      <Text style={[ui.caption, { color: c.textSecondary }]}>신고 내용은 다른 이용자에게 공개되지 않아요.</Text>
    </>}
  </Page>;
}
