import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { agreementApi } from '../api/agreement';
import { lightTap } from '../utils/haptics';

interface TermsAgreementModalProps {
  visible: boolean;
  onAgree: () => void;
  onCancel: () => void;
}

export function TermsAgreementModal({ visible, onAgree, onCancel }: TermsAgreementModalProps) {
  const c = useTheme();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAgree = async () => {
    lightTap();
    setLoading(true);
    try {
      await agreementApi.agree('TERMS_OF_SERVICE');
      onAgree();
    } catch {
      // 실패해도 진행 허용 (서버 에러 시 UX 차단 방지)
      onAgree();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.textPrimary }]}>이용약관 동의</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            위시맵 서비스 이용을 위해 약관에 동의해주세요
          </Text>
        </View>

        <ScrollView style={[styles.termsBox, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Text style={[styles.termsText, { color: c.textSecondary }]}>
            {`위시맵 이용약관 요약

1. 서비스 이용
위시맵은 회사 동료들과 장소를 공유하는 지도 서비스입니다.

2. 사용자 콘텐츠
사용자가 작성한 방문 인증, 댓글, 장소 제보 등의 콘텐츠에 대한 책임은 작성자에게 있습니다.

3. 부적절한 콘텐츠 금지
다음과 같은 콘텐츠는 엄격히 금지되며, 위반 시 즉시 삭제 및 계정 정지 조치가 이루어집니다:
- 스팸, 광고성 콘텐츠
- 욕설, 비방, 혐오 표현
- 허위 정보 또는 사기성 콘텐츠
- 타인의 개인정보 무단 게시
- 음란물 또는 폭력적인 내용

4. 신고 및 차단
- 부적절한 콘텐츠를 발견하면 신고 기능을 이용해주세요
- 신고된 콘텐츠는 24시간 이내에 검토됩니다
- 다른 사용자를 차단하면 해당 사용자의 콘텐츠가 더 이상 표시되지 않습니다

5. 계정 탈퇴
언제든 계정을 삭제할 수 있으며, 삭제 시 모든 데이터가 영구적으로 제거됩니다.

6. 면책
사용자가 생성한 콘텐츠의 정확성에 대해 위시맵은 보증하지 않습니다.`}
          </Text>
        </ScrollView>

        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => { lightTap(); setChecked(!checked); }}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, { borderColor: checked ? c.primary : c.textDisabled, backgroundColor: checked ? c.primary : 'transparent' }]}>
            {checked && <Text style={styles.checkmark}>{'✓'}</Text>}
          </View>
          <Text style={[styles.checkboxLabel, { color: c.textPrimary }]}>
            이용약관에 동의합니다
          </Text>
        </TouchableOpacity>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: c.border }]}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: c.textSecondary }]}>취소</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.agreeButton, { backgroundColor: checked ? c.primary : c.border }]}
            onPress={handleAgree}
            disabled={!checked || loading}
            activeOpacity={0.8}
          >
            <Text style={styles.agreeText}>동의하고 계속하기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 60 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { fontSize: 15 },
  termsBox: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  termsText: { fontSize: 14, lineHeight: 22 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { fontSize: 15, fontWeight: '500' },
  buttons: { flexDirection: 'row', gap: 12 },
  cancelButton: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '600' },
  agreeButton: {
    flex: 2,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  agreeText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
