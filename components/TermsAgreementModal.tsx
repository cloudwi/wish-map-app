import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { agreementApi } from '../api/agreement';
import { TERMS_SECTIONS, PRIVACY_SECTIONS } from '../constants/legal-content';
import { Button, Notice, ui } from './ServiceUI';

export function TermsAgreementModal({ visible, onAgree, onCancel }: { visible: boolean; onAgree: () => void; onCancel: () => void }) {
  const c = useTheme();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [document, setDocument] = useState('TERMS');
  useEffect(() => { if (visible) { setChecked(false); setError(''); setDocument('TERMS'); } }, [visible]);
  const agree = async () => {
    if (!checked || busy) return;
    setBusy(true); setError('');
    try { await agreementApi.agree('TERMS_OF_SERVICE'); onAgree(); }
    catch { setError('동의 내용을 저장하지 못했어요. 연결을 확인하고 다시 시도해주세요.'); }
    finally { setBusy(false); }
  };
  return <Modal visible={visible} animationType="slide" onRequestClose={() => { if (!busy) onCancel(); }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={[ui.page, { flex: 1, flexGrow: 0, paddingBottom: 20 }]}>
        <Text style={[ui.heading, { color: c.textPrimary }]}>시작하기 전에 확인해주세요</Text>
        <Text style={[ui.body, { color: c.textSecondary }]}>안심하고 함께하는 모임을 위한 약속이에요.</Text>
        <View style={[ui.row, { flexWrap: 'wrap' }]}>
          <Button label="이용약관" secondary={document !== 'TERMS'} onPress={() => setDocument('TERMS')} />
          <Button label="개인정보처리방침" secondary={document !== 'PRIVACY'} onPress={() => setDocument('PRIVACY')} />
        </View>
        <ScrollView style={{ flex: 1, backgroundColor: c.cardBg, borderRadius: 16, borderWidth: 1, borderColor: c.border }} contentContainerStyle={{ padding: 18, gap: 16 }}>
          {(document === 'TERMS' ? TERMS_SECTIONS : PRIVACY_SECTIONS).map((section) => <View key={section.title} style={{ gap: 8 }}>
            <Text style={[ui.label, { color: c.textPrimary }]}>{section.title}</Text><Text style={[ui.body, { color: c.textSecondary }]}>{section.content}</Text>
          </View>)}
        </ScrollView>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="이용약관 동의" accessibilityState={{ checked }} disabled={busy}
          onPress={() => setChecked((value) => !value)} style={[ui.row, { minHeight: 52 }]}>
          <Text style={{ color: c.primary, fontSize: 23 }}>{checked ? '☑' : '□'}</Text>
          <Text style={[ui.body, { color: c.textPrimary, flex: 1 }]}>이용약관에 동의하고 개인정보처리방침을 확인했어요.</Text>
        </Pressable>
        <Notice message={error} />
        <Button label="동의하고 계속하기" onPress={() => void agree()} disabled={!checked} busy={busy} />
        <Button label="나중에 할게요" secondary disabled={busy} onPress={onCancel} />
      </View>
    </SafeAreaView>
  </Modal>;
}
