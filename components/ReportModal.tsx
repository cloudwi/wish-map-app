import { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { reportApi, ReportTargetType, ReportReason } from '../api/report';
import { showSuccess, showError } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';
import { lightTap } from '../utils/haptics';
import { KEYBOARD_DONE_ID, KeyboardDoneBar } from './KeyboardDoneBar';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
}

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'SPAM', label: '스팸' },
  { value: 'INAPPROPRIATE', label: '부적절한 내용' },
  { value: 'FALSE_INFO', label: '허위 정보' },
  { value: 'OTHER', label: '기타' },
];

export function ReportModal({ visible, onClose, targetType, targetId }: ReportModalProps) {
  const c = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) return;
    lightTap();
    setLoading(true);
    try {
      await reportApi.create({
        targetType,
        targetId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      showSuccess('신고 완료', '검토 후 조치하겠습니다');
      handleClose();
    } catch (e: unknown) {
      showError('신고 실패', getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: c.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.textPrimary }]}>신고하기</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={c.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: c.textSecondary }]}>사유를 선택해주세요</Text>

          {REASONS.map((reason) => (
            <TouchableOpacity
              key={reason.value}
              style={[
                styles.reasonRow,
                { borderColor: selectedReason === reason.value ? c.primary : c.border },
                selectedReason === reason.value && { backgroundColor: c.primaryBg },
              ]}
              onPress={() => { lightTap(); setSelectedReason(reason.value); }}
              activeOpacity={0.7}
            >
              <View style={[
                styles.radio,
                { borderColor: selectedReason === reason.value ? c.primary : c.textDisabled },
              ]}>
                {selectedReason === reason.value && (
                  <View style={[styles.radioInner, { backgroundColor: c.primary }]} />
                )}
              </View>
              <Text style={[styles.reasonLabel, { color: c.textPrimary }]}>{reason.label}</Text>
            </TouchableOpacity>
          ))}

          <TextInput
            style={[styles.input, { backgroundColor: c.surfaceSecondary, color: c.textPrimary, borderColor: c.border }]}
            placeholder="상세 내용 (선택)"
            placeholderTextColor={c.textDisabled}
            value={description}
            onChangeText={setDescription}
            multiline
            maxLength={200}
            inputAccessoryViewID={KEYBOARD_DONE_ID}
          />

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: selectedReason ? c.primary : c.border }]}
            onPress={handleSubmit}
            disabled={!selectedReason || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitText}>신고하기</Text>
            )}
          </TouchableOpacity>
          <KeyboardDoneBar />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '700' },
  subtitle: { fontSize: 14, marginBottom: 16 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  reasonLabel: { fontSize: 15, fontWeight: '500' },
  input: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
