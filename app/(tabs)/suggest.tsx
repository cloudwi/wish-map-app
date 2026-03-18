import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { restaurantApi } from '../../api/restaurant';
import { PlaceResult } from '../../api/search';
import { CreateRestaurantRequest } from '../../types';
import { AuthRequired } from '../../components/AuthRequired';
import { useSearch } from '../../hooks/useSearch';
import { useTheme } from '../../hooks/useTheme';
import { showSuccess, showError, showInfo } from '../../utils/toast';
import { lightTap, successTap } from '../../utils/haptics';

const CATEGORIES = ['한식', '중식', '일식', '양식', '카페', '술집', '기타'];

export default function SuggestScreen() {
  const c = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { placeJson } = useLocalSearchParams<{ placeJson?: string }>();
  const [loading, setLoading] = useState(false);
  const { searchQuery, setSearchQuery, searchResults, setSearchResults, searching, handleSearch: onSearch, clearSearch } = useSearch({ debounceDelay: 300 });
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const descRef = useRef<TextInput>(null);

  useEffect(() => {
    if (placeJson) {
      try {
        const place = JSON.parse(placeJson) as PlaceResult;
        handleSelectPlace(place);
      } catch {}
    }
  }, [placeJson]);

  if (!isAuthenticated) {
    return (
      <AuthRequired
        icon="lock-closed-outline"
        message="맛집을 제안하려면 먼저 로그인해주세요"
      />
    );
  }

  const handleSearch = (text: string) => {
    setSelectedPlace(null);
    onSearch(text);
  };

  const handleSelectPlace = (place: PlaceResult) => {
    lightTap();
    setSelectedPlace(place);
    setSearchQuery(place.name);
    setSearchResults([]);

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
      clearSearch();
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
        style={[styles.container, { backgroundColor: c.surface }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            맛집을 검색해서 제안해주세요!
          </Text>

          {/* 장소 검색 */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: c.textPrimary }]}>장소 검색 <Text style={{ color: c.primary }}>*</Text></Text>
            <View style={[styles.searchWrap, { backgroundColor: c.inputBg, borderColor: 'transparent' }, focusedField === 'search' && { borderColor: c.primary, backgroundColor: c.surface }]}>
              <Ionicons name="search-outline" size={18} color={c.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: c.textPrimary }]}
                placeholder="가게 이름이나 주소로 검색"
                placeholderTextColor={c.textDisabled}
                value={searchQuery}
                onChangeText={handleSearch}
                returnKeyType="search"
                onFocus={() => setFocusedField('search')}
                onBlur={() => setFocusedField(null)}
              />
              {searching && <ActivityIndicator size="small" color={c.primary} />}
              {searchQuery.length > 0 && !searching && (
                <TouchableOpacity onPress={() => { clearSearch(); setSelectedPlace(null); }} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color={c.textDisabled} />
                </TouchableOpacity>
              )}
            </View>

            {searchResults.length > 0 && (
              <View style={[styles.resultsList, { backgroundColor: c.surface, borderColor: c.border }]}>
                {searchResults.map((place) => (
                  <TouchableOpacity
                    key={place.id}
                    style={[styles.resultItem, { borderBottomColor: c.divider }]}
                    onPress={() => handleSelectPlace(place)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="location-outline" size={18} color={c.primary} style={styles.resultIcon} />
                    <View style={styles.resultContent}>
                      <Text style={[styles.resultName, { color: c.textPrimary }]} numberOfLines={1}>{place.name}</Text>
                      <Text style={[styles.resultAddress, { color: c.textSecondary }]} numberOfLines={1}>
                        {place.roadAddress || place.address}
                      </Text>
                      {place.category ? (
                        <Text style={[styles.resultCategory, { color: c.textTertiary }]}>{place.category}</Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* 선택된 장소 */}
          {selectedPlace && (
            <View style={[styles.selectedCard, { backgroundColor: c.selectedCardBg, borderColor: c.selectedCardBorder }]}>
              <View style={styles.selectedIconWrap}>
                <Ionicons name="checkmark-circle" size={22} color={c.success} />
              </View>
              <View style={styles.selectedContent}>
                <Text style={[styles.selectedName, { color: c.textPrimary }]}>{selectedPlace.name}</Text>
                <Text style={[styles.selectedAddress, { color: c.textSecondary }]}>{selectedPlace.roadAddress || selectedPlace.address}</Text>
                {selectedPlace.phone ? (
                  <Text style={[styles.selectedPhone, { color: c.textTertiary }]}>{selectedPlace.phone}</Text>
                ) : null}
              </View>
            </View>
          )}

          {/* 카테고리 */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: c.textPrimary }]}>카테고리</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, { backgroundColor: c.chipBg }, category === cat && { backgroundColor: c.chipActiveBg }]}
                  onPress={() => { lightTap(); setCategory(category === cat ? '' : cat); }}
                >
                  <Text style={[styles.chipText, { color: c.chipText }, category === cat && { color: c.chipActiveText, fontWeight: '600' }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: c.divider }]} />

          {/* 설명 */}
          <View style={styles.group}>
            <Text style={[styles.label, { color: c.textPrimary }]}>추천 이유</Text>
            <TextInput
              ref={descRef}
              style={[styles.input, styles.textarea, { borderColor: c.border, backgroundColor: c.inputBg, color: c.textPrimary }, focusedField === 'desc' && { borderColor: c.primary, backgroundColor: c.surface }]}
              placeholder="이 맛집을 추천하는 이유를 적어주세요"
              placeholderTextColor={c.textDisabled}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              maxLength={2000}
              textAlignVertical="top"
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
            />
            <Text style={[styles.charCount, { color: c.textDisabled }]}>{description.length}/2000</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (loading || !selectedPlace) && { backgroundColor: c.textDisabled }]}
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
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  subtitle: { fontSize: 15, marginBottom: 24, lineHeight: 22 },
  group: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
    borderWidth: 1.5,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  clearBtn: { padding: 8 },
  resultsList: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 300,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
  },
  resultIcon: { marginTop: 2, marginRight: 10 },
  resultContent: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', marginBottom: 3 },
  resultAddress: { fontSize: 13 },
  resultCategory: { fontSize: 12, marginTop: 2 },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    gap: 12,
    borderWidth: 1,
  },
  selectedIconWrap: { marginTop: 1 },
  selectedContent: { flex: 1 },
  selectedName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  selectedAddress: { fontSize: 13 },
  selectedPhone: { fontSize: 12, marginTop: 2 },
  input: {
    borderWidth: 1.5, borderRadius: 12,
    paddingHorizontal: 15, paddingVertical: 12, fontSize: 15,
  },
  textarea: { height: 120, paddingTop: 14 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18 },
  chipText: { fontSize: 14 },
  divider: { height: 1, marginBottom: 24 },
  submitBtn: {
    backgroundColor: '#FF6B35', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8, marginBottom: 40,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
