import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, FlatList } from 'react-native';
import { useState, useRef, useCallback } from 'react';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { restaurantApi } from '../../api/restaurant';
import { searchPlaces, PlaceResult } from '../../api/search';
import { CreateRestaurantRequest } from '../../types';
import { AuthRequired } from '../../components/AuthRequired';
import { showSuccess, showError, showInfo } from '../../utils/toast';
import { lightTap, successTap } from '../../utils/haptics';

const CATEGORIES = ['한식', '중식', '일식', '양식', '카페', '술집', '기타'];

export default function SuggestScreen() {
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const descRef = useRef<TextInput>(null);

  if (!isAuthenticated) {
    return (
      <AuthRequired
        icon="lock-closed-outline"
        message="맛집을 제안하려면 먼저 로그인해주세요"
      />
    );
  }

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    setSelectedPlace(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchPlaces(text);
        setSearchResults(results);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelectPlace = (place: PlaceResult) => {
    lightTap();
    setSelectedPlace(place);
    setSearchQuery(place.name);
    setSearchResults([]);

    // 카카오 카테고리 → 앱 카테고리 자동 매핑
    if (!category) {
      const catMap: Record<string, string> = {
        '카페': '카페',
        '한식': '한식',
        '중식': '중식',
        '일식': '일식',
        '양식': '양식',
      };
      const matched = Object.entries(catMap).find(([key]) => place.category.includes(key));
      if (matched) setCategory(matched[1]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPlace) {
      showInfo('알림', '장소를 검색해서 선택해주세요.');
      return;
    }

    const form: CreateRestaurantRequest = {
      name: selectedPlace.name,
      address: selectedPlace.roadAddress || selectedPlace.address,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      category,
      description,
    };

    try {
      setLoading(true);
      await restaurantApi.createRestaurant(form);
      successTap();
      showSuccess('제안 완료!', '관리자 승인 후 지도에 표시됩니다.');
      setSearchQuery('');
      setSelectedPlace(null);
      setCategory('');
      setDescription('');
      router.push('/(tabs)');
    } catch (error: any) {
      showError('오류', error.response?.data?.message || '제안 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '맛집 제안', headerBackTitle: '' }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.subtitle}>
            맛집을 검색해서 제안해주세요!
          </Text>

          {/* 장소 검색 */}
          <View style={styles.group}>
            <Text style={styles.label}>장소 검색 <Text style={styles.required}>*</Text></Text>
            <View style={[styles.searchWrap, focusedField === 'search' && styles.searchWrapFocused]}>
              <Ionicons name="search-outline" size={18} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="가게 이름이나 주소로 검색"
                placeholderTextColor="#bbb"
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
                onFocus={() => setFocusedField('search')}
                onBlur={() => setFocusedField(null)}
              />
              {searching && <ActivityIndicator size="small" color="#FF6B35" />}
              {searchQuery.length > 0 && !searching && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); setSelectedPlace(null); }} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="#ccc" />
                </TouchableOpacity>
              )}
            </View>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <View style={styles.resultsList}>
                {searchResults.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={styles.resultItem}
                    onPress={() => handleSelectPlace(place)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="location-outline" size={18} color="#FF6B35" style={styles.resultIcon} />
                    <View style={styles.resultContent}>
                      <Text style={styles.resultName} numberOfLines={1}>{place.name}</Text>
                      <Text style={styles.resultAddress} numberOfLines={1}>
                        {place.roadAddress || place.address}
                      </Text>
                      {place.category ? (
                        <Text style={styles.resultCategory}>{place.category}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 선택된 장소 */}
          {selectedPlace && (
            <View style={styles.selectedCard}>
              <View style={styles.selectedIconWrap}>
                <Ionicons name="checkmark-circle" size={22} color="#4CAF50" />
              </View>
              <View style={styles.selectedContent}>
                <Text style={styles.selectedName}>{selectedPlace.name}</Text>
                <Text style={styles.selectedAddress}>{selectedPlace.roadAddress || selectedPlace.address}</Text>
                {selectedPlace.phone ? (
                  <Text style={styles.selectedPhone}>{selectedPlace.phone}</Text>
                ) : null}
              </View>
            </View>
          )}

          {/* 카테고리 */}
          <View style={styles.group}>
            <Text style={styles.label}>카테고리</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => { lightTap(); setCategory(category === cat ? '' : cat); }}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* 설명 */}
          <View style={styles.group}>
            <Text style={styles.label}>추천 이유</Text>
            <TextInput
              ref={descRef}
              style={[styles.input, styles.textarea, focusedField === 'desc' && styles.inputFocused]}
              placeholder="이 맛집을 추천하는 이유를 적어주세요"
              placeholderTextColor="#bbb"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={2000}
              textAlignVertical="top"
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
            />
            <Text style={styles.charCount}>{description.length}/2000</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (loading || !selectedPlace) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading || !selectedPlace}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnText}>맛집 제안하기</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 20 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 24, lineHeight: 22 },
  group: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  required: { color: '#FF6B35' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchWrapFocused: { borderColor: '#FF6B35', backgroundColor: '#fff' },
  searchInput: { flex: 1, fontSize: 15, color: '#333', paddingVertical: 0 },
  clearBtn: { padding: 8 },
  resultsList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    maxHeight: 300,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  resultIcon: { marginTop: 2, marginRight: 10 },
  resultContent: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 3 },
  resultAddress: { fontSize: 13, color: '#888' },
  resultCategory: { fontSize: 12, color: '#aaa', marginTop: 2 },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: '#D4EDDA',
  },
  selectedIconWrap: { marginTop: 1 },
  selectedContent: { flex: 1 },
  selectedName: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 2 },
  selectedAddress: { fontSize: 13, color: '#666' },
  selectedPhone: { fontSize: 12, color: '#999', marginTop: 2 },
  input: {
    borderWidth: 1.5, borderColor: '#eee', borderRadius: 12,
    paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, backgroundColor: '#fafafa',
  },
  inputFocused: { borderColor: '#FF6B35', backgroundColor: '#fff' },
  textarea: { height: 120, paddingTop: 14 },
  charCount: { fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#333' },
  chipText: { fontSize: 14, color: '#888' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#f0f0f0', marginBottom: 24 },
  submitBtn: {
    backgroundColor: '#FF6B35', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 40,
  },
  submitBtnDisabled: { backgroundColor: '#ddd' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
