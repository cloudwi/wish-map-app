import { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { restaurantApi } from '../api/restaurant';
import { placeCategoryApi } from '../api/placeCategory';
import { uploadImages } from '../utils/imageUpload';
import { lightTap, successTap, mediumTap } from '../utils/haptics';
import { showError, showSuccess } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';
import { PlaceCategory, matchNaverCategory } from '../types';

const VISIT_DISTANCE_LIMIT = 100;

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function VisitReviewScreen() {
  const c = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    placeName: string;
    placeLat: string;
    placeLng: string;
    placeId: string;
    placeCategory: string;
    restaurantId: string;
    placeCategoryId: string;
  }>();

  const [placeCategories, setPlaceCategories] = useState<PlaceCategory[]>([]);
  const [detectedCategoryId, setDetectedCategoryId] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const detectedCategory = placeCategories.find(c => c.id === detectedCategoryId);

  useEffect(() => {
    placeCategoryApi.getPlaceCategories()
      .then((cats) => {
        setPlaceCategories(cats);
        autoDetect(cats);
      })
      .catch(() => {
        // 서버 연결 실패 시 빈 상태
      });
  }, []);

  const autoDetect = (cats: PlaceCategory[]) => {
    // 직접 등록: placeCategoryId가 전달된 경우 우선 사용
    if (params.placeCategoryId) {
      const catId = Number(params.placeCategoryId);
      if (cats.some(c => c.id === catId)) {
        setDetectedCategoryId(catId);
        return;
      }
    }
    if (!params.placeCategory) return;
    const matched = matchNaverCategory(params.placeCategory, cats);
    if (matched) setDetectedCategoryId(matched.id);
  };

  const toggleTag = (tag: string) => {
    lightTap();
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const pickImage = async () => {
    lightTap();
    try {
      const ImagePicker = require('expo-image-picker') as typeof import('expo-image-picker');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 접근 권한을 허용해주세요.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 5 - images.length,
        quality: 0.7,
      });
      if (!result.canceled) {
        const newImages = [...images, ...result.assets.map(a => a.uri)].slice(0, 5);
        setImages(newImages);
        const newUris = result.assets.map(a => a.uri).slice(0, 5 - images.length);
        handleUpload(newUris);
      }
    } catch {
      Alert.alert('알림', '사진 기능은 네이티브 빌드에서만 사용 가능합니다.');
    }
  };

  const handleUpload = async (uris: string[]) => {
    setUploading(true);
    try {
      const urls = await uploadImages(uris);
      setUploadedUrls(prev => [...prev, ...urls]);
    } catch (error: unknown) {
      showError('업로드 실패', getErrorMessage(error, '이미지 업로드에 실패했습니다.'));
      setImages(prev => prev.filter(uri => !uris.includes(uri)));
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    lightTap();
    setImages(prev => prev.filter((_, i) => i !== index));
    setUploadedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const isUploadPending = images.length > 0 && (uploading || uploadedUrls.length < images.length);

  const handleSubmit = async () => {
    if (isUploadPending) {
      Alert.alert('잠시만요', '이미지 업로드가 진행 중입니다.');
      return;
    }

    setSubmitting(true);
    mediumTap();

    try {
      const Location = require('expo-location') as typeof import('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showError('위치 권한 필요', '설정에서 위치 권한을 허용해주세요.');
        return;
      }
      let loc = await Location.getLastKnownPositionAsync();
      if (!loc) {
        loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      }
      const dist = haversineDistance(
        loc.coords.latitude, loc.coords.longitude,
        Number(params.placeLat), Number(params.placeLng)
      );
      if (dist > VISIT_DISTANCE_LIMIT) {
        const distText = dist >= 1000 ? `${(dist / 1000).toFixed(1)}km` : `${Math.round(dist)}m`;
        showError('장소 근처에서 시도해주세요', `현재 ${distText} 떨어져 있어요.`);
        return;
      }

      const result = await restaurantApi.quickVisit({
        name: params.placeName,
        lat: Number(params.placeLat),
        lng: Number(params.placeLng),
        naverPlaceId: params.placeId || undefined,
        category: params.placeCategory || undefined,
        userLat: loc.coords.latitude,
        userLng: loc.coords.longitude,
        placeCategoryId: detectedCategoryId || undefined,
        comment: comment.trim() || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        imageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });

      successTap();
      showSuccess('방문 인증 완료!');
      router.replace(`/restaurant/${result.restaurantId}`);
    } catch (error: unknown) {
      const msg = getErrorMessage(error, '방문 인증 중 오류가 발생했습니다.');
      if (msg.includes('이미') && msg.includes('방문')) {
        showError('이미 방문 완료', '오늘 이미 방문 인증한 장소입니다.');
        const rid = params.restaurantId ? Number(params.restaurantId) : null;
        if (rid) router.replace(`/restaurant/${rid}`);
      } else {
        showError('방문 인증 실패', msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: c.background, borderBottomColor: c.divider }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color={c.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: c.textPrimary }]}>방문 인증</Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[styles.skipText, { color: c.textTertiary }]}>취소</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* 장소 정보 */}
          <View style={[styles.placeCard, { backgroundColor: c.cardBg }]}>
            <Ionicons name="location" size={20} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.placeName, { color: c.textPrimary }]}>{params.placeName}</Text>
              {params.placeCategory ? (
                <Text style={[styles.placeCategory, { color: c.textTertiary }]}>{params.placeCategory}</Text>
              ) : !params.placeId ? (
                <Text style={[styles.placeCategory, { color: c.primary }]}>직접 등록 장소</Text>
              ) : null}
            </View>
          </View>

          {/* 카테고리별 태그 */}
          {detectedCategory?.tagGroups.map((group) => (
            <View key={group.key} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>{group.key}</Text>
              <View style={styles.chipGrid}>
                {group.tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.chip,
                        { backgroundColor: c.chipBg, borderColor: c.border },
                        isSelected && { backgroundColor: c.chipActiveBg, borderColor: c.chipActiveBg },
                      ]}
                      onPress={() => toggleTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.chipText,
                        { color: c.textSecondary },
                        isSelected && { color: c.chipActiveText, fontWeight: '600' },
                      ]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}

          {/* 글 작성 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>한줄 메모</Text>
            <TextInput
              style={[styles.textInput, { borderColor: c.border, backgroundColor: c.inputBg, color: c.textPrimary }]}
              placeholder="이 장소는 어땠나요?"
              placeholderTextColor={c.textDisabled}
              value={comment}
              onChangeText={setComment}
              maxLength={200}
              multiline
              textAlignVertical="top"
              onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300)}
            />
            <Text style={[styles.charCount, { color: c.textDisabled }]}>{comment.length}/200</Text>
          </View>

          {/* 사진 */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>사진</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrap}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity style={styles.imageRemove} onPress={() => removeImage(index)}>
                    <Ionicons name="close-circle" size={22} color="#FF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {images.length < 5 && !uploading && (
                <TouchableOpacity
                  style={[styles.addImageBtn, { borderColor: c.border, backgroundColor: c.inputBg }]}
                  onPress={pickImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={24} color={c.textTertiary} />
                  <Text style={[styles.addImageText, { color: c.textTertiary }]}>{images.length}/5</Text>
                </TouchableOpacity>
              )}
              {uploading && <ActivityIndicator style={{ marginLeft: 8 }} color={c.primary} />}
            </ScrollView>
            {!uploading && uploadedUrls.length > 0 && uploadedUrls.length === images.length && (
              <Text style={[styles.uploadDone, { color: c.textTertiary }]}>{uploadedUrls.length}장 업로드 완료</Text>
            )}
          </View>

          {/* 제출 */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: c.primary },
              (submitting || isUploadPending) && { opacity: 0.5 },
            ]}
            onPress={handleSubmit}
            disabled={submitting || isUploadPending}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.submitText}>방문 인증</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
  },
  backBtn: { marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600' },
  skipText: { fontSize: 14, fontWeight: '500' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  placeName: { fontSize: 17, fontWeight: '600' },
  placeCategory: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
  },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  imageRow: { gap: 10, paddingTop: 8, paddingRight: 8 },
  imageWrap: { position: 'relative' },
  imageThumb: { width: 80, height: 80, borderRadius: 12 },
  imageRemove: { position: 'absolute', top: -6, right: -6 },
  addImageBtn: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addImageText: { fontSize: 11 },
  uploadDone: { fontSize: 12, marginTop: 8 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
