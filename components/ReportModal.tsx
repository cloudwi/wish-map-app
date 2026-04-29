import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput, StyleSheet,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { reportApi, ReportTargetType, ReportReason } from '../api/report';
import { showSuccess, showError } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';
import { lightTap } from '../utils/haptics';

interface ReportModalProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: number;
  onClose: () => void;
  onReported?: () => void;
}

const REASONS: { key: ReportReason; label: string; desc: string }[] = [
  { key: 'SPAM',         label: '스팸/광고',          desc: '반복 광고, 홍보, 도배' },
  { key: 'INAPPROPRIATE', label: '부적절한 콘텐츠',   desc: '욕설, 혐오, 선정적 내용' },
  { key: 'FALSE_INFO',   label: '허위 정보',          desc: '잘못되거나 오해를 주는 정보' },
  { key: 'OTHER',        label: '기타',               desc: '그 외 사유' },
];

export function ReportModal({ visible, targetType, targetId, onClose, onReported }: ReportModalProps) {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) {
      setReason(null);
      setDescription('');
      setSubmitting(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      lightTap();
      await reportApi.create({ targetType, targetId, reason, description: description.trim() || undefined });
      showSuccess('신고 접수', '신고가 접수되었습니다. 24시간 이내에 검토됩니다.');
      onReported?.();
      onClose();
    } catch (e: unknown) {
      showError('신고 실패', getErrorMessage(e, '신고 중 오류가 발생했습니다'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior="padding"
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.textPrimary }]}>신고하기</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: c.textTertiary }]}>
            신고된 콘텐츠는 24시간 이내에 검토되며, 가이드라인을 위반한 경우 삭제됩니다.
          </Text>

          <View style={styles.reasonList}>
            {REASONS.map((r) => {
              const selected = reason === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  onPress={() => { lightTap(); setReason(r.key); }}
                  style={[
                    styles.reasonRow,
                    { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primaryBg : 'transparent' },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reasonLabel, { color: c.textPrimary }]}>{r.label}</Text>
                    <Text style={[styles.reasonDesc, { color: c.textTertiary }]}>{r.desc}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={18} color={c.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            style={[styles.input, { color: c.textPrimary, borderColor: c.border, backgroundColor: c.background }]}
            placeholder="상세 내용 (선택)"
            placeholderTextColor={c.textTertiary}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={500}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: reason ? c.primary : c.border },
            ]}
            onPress={handleSubmit}
            disabled={!reason || submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>신고 제출</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 20,
    gap: 16,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 12, lineHeight: 18 },
  reasonList: { gap: 8 },
  reasonRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1, borderRadius: 10, gap: 10,
  },
  reasonLabel: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  reasonDesc: { fontSize: 12 },
  input: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    minHeight: 72, fontSize: 14,
  },
  submitButton: {
    paddingVertical: 14, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
