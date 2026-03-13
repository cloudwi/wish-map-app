import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { restaurantApi } from '../../api/restaurant';
import { CreateRestaurantRequest } from '../../types';
import { AuthRequired } from '../../components/AuthRequired';

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
      Alert.alert('알림', '가게 이름을 입력해주세요.');
      return;
    }
    if (!form.address.trim()) {
      Alert.alert('알림', '주소를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      await restaurantApi.createRestaurant(form);
      Alert.alert(
        '제안 완료! 🎉',
        '맛집 제안이 등록되었습니다.\n관리자 승인 후 지도에 표시됩니다.',
        [{ text: '확인', onPress: () => { setForm(INITIAL_FORM); router.push('/(tabs)'); } }],
      );
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '제안 등록에 실패했습니다.');
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
          <Text style={styles.label}>가게 이름 *</Text>
          <TextInput
            style={styles.input}
            placeholder="맛집 이름을 입력하세요"
            value={form.name}
            onChangeText={(text) => update({ name: text })}
            maxLength={100}
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>주소 *</Text>
          <TextInput
            style={styles.input}
            placeholder="주소를 입력하세요"
            value={form.address}
            onChangeText={(text) => update({ address: text })}
            maxLength={500}
          />
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>카테고리</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, form.category === cat && styles.chipActive]}
                onPress={() => update({ category: cat })}
              >
                <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.group}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="이 맛집을 추천하는 이유를 적어주세요"
            value={form.description}
            onChangeText={(text) => update({ description: text })}
            multiline
            numberOfLines={4}
            maxLength={2000}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
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
  group: { marginBottom: 20 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
  textarea: { height: 120, paddingTop: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#FF6B35' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#FF6B35', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 40,
  },
  submitBtnDisabled: { backgroundColor: '#ffaa88' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
