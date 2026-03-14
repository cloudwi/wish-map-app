import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { restaurantApi } from '../../api/restaurant';
import { CreateRestaurantRequest } from '../../types';
import { AuthRequired } from '../../components/AuthRequired';
import { showSuccess, showError, showInfo } from '../../utils/toast';
import { lightTap, successTap } from '../../utils/haptics';

const CATEGORIES = ['한식', '중식', '일식', '양식', '카페', '술집', '기타'];

const INITIAL_FORM: CreateRestaurantRequest = {
  name: '',
  address: '',
  lat: 37.5665,
  lng: 126.9780,
  category: '',
  description: '',
};

export default function SuggestScreen() {
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateRestaurantRequest>(INITIAL_FORM);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const addressRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);

  if (!isAuthenticated) {
    return (
      <AuthRequired
        icon="lock-closed-outline"
        message="맛집을 제안하려면 먼저 로그인해주세요"
      />
    );
  }

  const update = (fields: Partial<CreateRestaurantRequest>) =>
    setForm(prev => ({ ...prev, ...fields }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      showInfo('알림', '가게 이름을 입력해주세요.');
      return;
    }
    if (!form.address.trim()) {
      showInfo('알림', '주소를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await restaurantApi.createRestaurant(form);
      successTap();
      showSuccess('제안 완료!', '관리자 승인 후 지도에 표시됩니다.');
      setForm(INITIAL_FORM);
      router.push('/(tabs)');
    } catch (error: any) {
      showError('오류', error.response?.data?.message || '제안 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          새로운 맛집을 제안해주세요! 승인 후 지도에 등록됩니다.
        </Text>

        <View style={styles.group}>
          <Text style={styles.label}>가게 이름 <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={[styles.input, focusedField === 'name' && styles.inputFocused]}
            placeholder="맛집 이름을 입력하세요"
            value={form.name}
            onChangeText={(text) => update({ name: text })}
            maxLength={100}
            returnKeyType="next"
            onSubmitEditing={() => addressRef.current?.focus()}
            onFocus={() => setFocusedField('name')}
            onBlur={() => setFocusedField(null)}
          />
          <Text style={styles.charCount}>{form.name.length}/100</Text>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>주소 <Text style={styles.required}>*</Text></Text>
          <TextInput
            ref={addressRef}
            style={[styles.input, focusedField === 'address' && styles.inputFocused]}
            placeholder="주소를 입력하세요"
            value={form.address}
            onChangeText={(text) => update({ address: text })}
            maxLength={500}
            returnKeyType="next"
            onSubmitEditing={() => descRef.current?.focus()}
            onFocus={() => setFocusedField('address')}
            onBlur={() => setFocusedField(null)}
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>카테고리</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, form.category === cat && styles.chipActive]}
                onPress={() => { lightTap(); update({ category: form.category === cat ? '' : cat }); }}
              >
                <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.group}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            ref={descRef}
            style={[styles.input, styles.textarea, focusedField === 'desc' && styles.inputFocused]}
            placeholder="이 맛집을 추천하는 이유를 적어주세요"
            value={form.description}
            onChangeText={(text) => update({ description: text })}
            multiline
            numberOfLines={4}
            maxLength={2000}
            textAlignVertical="top"
            onFocus={() => setFocusedField('desc')}
            onBlur={() => setFocusedField(null)}
          />
          <Text style={styles.charCount}>{form.description?.length || 0}/2000</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>맛집 제안하기</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 24, lineHeight: 20 },
  group: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  required: { color: '#FF6B35' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
  inputFocused: { borderColor: '#FF6B35', backgroundColor: '#fff' },
  textarea: { height: 120, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#FF6B35' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 24 },
  submitBtn: {
    backgroundColor: '#FF6B35', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 40,
  },
  submitBtnDisabled: { backgroundColor: '#ffaa88' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
