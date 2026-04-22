import { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { WishInput } from './WishInput';
import { Button } from './Button';
import { spacing, typography, radius } from '../constants/theme';
import { useAppStore } from '../stores/appStore';

interface PromptModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  submitLabel?: string;
  onClose: () => void;
  onSubmit: (value: string) => void | Promise<void>;
  /** 유효성 검사. 에러 메시지 문자열 반환, 정상이면 null */
  validate?: (value: string) => string | null;
}

/**
 * Alert.prompt를 대체하는 단일 필드 입력 모달.
 * - 모달 시트가 키보드와 함께 움직여 Cancel/Save 버튼이 키보드 바로 위에 유지됨
 * - 배경 탭 시 닫힘
 * - WishInput + Button 재사용
 */
export function PromptModal({
  visible,
  title,
  subtitle,
  defaultValue = '',
  placeholder,
  maxLength,
  submitLabel = '저장',
  onClose,
  onSubmit,
  validate,
}: PromptModalProps) {
  const c = useTheme();
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setValue(defaultValue);
      setError(null);
      const t = setTimeout(() => inputRef.current?.focus(), 250);
      return () => clearTimeout(t);
    }
  }, [visible, defaultValue]);

  // 모달에 이미 취소 버튼이 있으므로 전역 키보드 X 버튼 숨김 (중복 UI 제거).
  // 닫을 때는 키보드가 완전히 내려간 뒤에 해제해야 X 버튼이 잠깐 보이는 깜빡임이 없다.
  useEffect(() => {
    if (!visible) return;
    useAppStore.getState().setSuppressKeyboardDoneBar(true);
    return () => {
      const release = () => useAppStore.getState().setSuppressKeyboardDoneBar(false);
      const sub = Keyboard.addListener('keyboardDidHide', () => {
        release();
        sub.remove();
        clearTimeout(fallback);
      });
      // 키보드가 이미 내려가 있어 이벤트가 안 오는 경우를 대비한 안전장치.
      const fallback = setTimeout(() => {
        release();
        sub.remove();
      }, 500);
    };
  }, [visible]);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    const err = validate ? validate(trimmed) : null;
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  const dismiss = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={dismiss}>
        <View style={[styles.overlay, { backgroundColor: c.dimmed }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.sheet, { backgroundColor: c.surface }]}>
                <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
                {subtitle && (
                  <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
                )}
                <WishInput
                  ref={inputRef}
                  style={[
                    styles.input,
                    {
                      borderColor: error ? c.error : c.border,
                      backgroundColor: c.inputBg,
                    },
                  ]}
                  placeholder={placeholder}
                  placeholderTextColor={c.textDisabled}
                  value={value}
                  onChangeText={(t) => {
                    setValue(t);
                    if (error) setError(null);
                  }}
                  maxLength={maxLength}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
                {error && <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>}
                <View style={styles.actions}>
                  <Button
                    label="취소"
                    variant="secondary"
                    onPress={dismiss}
                    style={{ flex: 1 }}
                  />
                  <Button
                    label={submitLabel}
                    onPress={handleSubmit}
                    loading={submitting}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  sheet: {
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body3,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  errorText: {
    ...typography.caption1,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
