import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { restaurantApi } from '../../api/restaurant';
import { CreateRestaurantRequest } from '../../types';

const CATEGORIES = ['한식', '중식', '일식', '양식', '카페', '술집', '기타'];

export default function SuggestScreen() {
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState<CreateRestaurantRequest>({
    name: '',
    address: '',
    lat: 37.5665,
    lng: 126.9780,
    category: '',
    description: '',
  });

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert('로그인 필요', '맛집을 제안하려면 로그인이 필요합니다.', [
        { text: '취소', style: 'cancel' },
        { text: '로그인', onPress: () => router.push('/login') }
      ]);
      return;
    }

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
        [{ text: '확인', onPress: () => {
          setForm({
            name: '',
            address: '',
            lat: 37.5665,
            lng: 126.9780,
            category: '',
            description: '',
          });
          router.push('/(tabs)');
        }}]
      );
    } catch (error: any) {
      Alert.alert('오류', error.response?.data?.message || '제안 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <Ionicons name="lock-closed-outline" size={64} color="#ccc" />
        <Text style={styles.authTitle}>로그인이 필요합니다</Text>
        <Text style={styles.authDescription}>
          맛집을 제안하려면 먼저 로그인해주세요
        </Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginButtonText}>로그인하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          새로운 맛집을 제안해주세요! 승인 후 지도에 등록됩니다.
        </Text>

        {/* 가게 이름 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>가게 이름 *</Text>
          <TextInput
            style={styles.input}
            placeholder="맛집 이름을 입력하세요"
            value={form.name}
            onChangeText={(text) => setForm({ ...form, name: text })}
            maxLength={100}
          />
        </View>

        {/* 주소 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>주소 *</Text>
          <TextInput
            style={styles.input}
            placeholder="주소를 입력하세요"
            value={form.address}
            onChangeText={(text) => setForm({ ...form, address: text })}
            maxLength={500}
          />
          {/* TODO: 네이버 장소 검색 API 연동 */}
        </View>

        {/* 카테고리 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>카테고리</Text>
          <View style={styles.categoryContainer}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  form.category === cat && styles.categoryChipActive
                ]}
                onPress={() => setForm({ ...form, category: cat })}
              >
                <Text style={[
                  styles.categoryChipText,
                  form.category === cat && styles.categoryChipTextActive
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 설명 */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>설명</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="이 맛집을 추천하는 이유를 적어주세요"
            value={form.description}
            onChangeText={(text) => setForm({ ...form, description: text })}
            multiline
            numberOfLines={4}
            maxLength={2000}
            textAlignVertical="top"
          />
        </View>

        {/* 제출 버튼 */}
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>맛집 제안하기</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#fafafa',
  },
  textArea: {
    height: 120,
    paddingTop: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryChipActive: {
    backgroundColor: '#FF6B35',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  submitButtonDisabled: {
    backgroundColor: '#ffaa88',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  authDescription: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
