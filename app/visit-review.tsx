import { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { restaurantApi } from '../api/restaurant';
import { uploadImages } from '../utils/imageUpload';
import { lightTap, successTap, mediumTap } from '../utils/haptics';
import { showError } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';

const TAGS = [
  '또 갈 집', '숨은 맛집', '점심 맛집', '회식 추천',
  '혼밥 성지', '줄 서는 집', '가성비 갑', '뷰 맛집',
];

export default function VisitReviewScreen() {
  const c = useTheme();
  const params = useLocalSearchParams<{
    placeName: string;
    placeLat: string;
    placeLng: string;
    placeId: string;
    placeCategory: string;
  }>();

  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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

        // 선택 즉시 업로드 시작
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
      // 업로드 실패한 이미지 제거
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

  const buildReviewText = () => {
    const parts: string[] = [];
    if (selectedTags.length > 0) parts.push(selectedTags.map(t => `#${t}`).join(' '));
    if (comment.trim()) parts.push(comment.trim());
    return parts.join('\n') || undefined;
  };

  // 이미지가 있는데 아직 업로드 중이면 제출 불가
  const isUploadPending = images.length > 0 && (uploading || uploadedUrls.length < images.length);

  const handleSubmit = async () => {
    if (isUploadPending) {
      Alert.alert('잠시만요', '이미지 업로드가 진행 중입니다. 완료 후 다시 시도해주세요.');
      return;
    }

    try {
      setLoading(true);
      mediumTap();

      const result = await restaurantApi.suggest({
        name: params.placeName,
        lat: Number(params.placeLat),
        lng: Number(params.placeLng),
        naverPlaceId: params.placeId || undefined,
        category: params.placeCategory || undefined,
        comment: buildReviewText(),
        imageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
      });

      successTap();
      router.replace(`/restaurant/${result.restaurantId}`);
    } catch (error: unknown) {
      showError('리뷰 실패', getErrorMessage(error, '리뷰 등록 중 오류가 발생했습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 장소 정보 */}
      <View style={[styles.placeCard, { backgroundColor: c.cardBg }]}>
        <Ionicons name="location" size={20} color={c.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.placeName, { color: c.textPrimary }]}>{params.placeName}</Text>
          {params.placeCategory ? (
            <Text style={[styles.placeCategory, { color: c.textTertiary }]}>{params.placeCategory}</Text>
          ) : null}
        </View>
      </View>

      {/* 태그 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>태그</Text>
        <View style={styles.tagGrid}>
          {TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  { backgroundColor: c.chipBg, borderColor: c.border },
                  isSelected && { backgroundColor: c.chipActiveBg, borderColor: c.chipActiveBg },
                ]}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.tagText,
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

      {/* 한줄 리뷰 */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>한줄 리뷰</Text>
        <TextInput
          style={[styles.textInput, { borderColor: c.border, backgroundColor: c.inputBg, color: c.textPrimary }]}
          placeholder="이 맛집은 어땠나요?"
          placeholderTextColor={c.textDisabled}
          value={comment}
          onChangeText={setComment}
          maxLength={200}
          multiline
          textAlignVertical="top"
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
        </ScrollView>
        {/* 업로드 완료 안내 (업로드 중이 아닐 때만) */}
        {!uploading && uploadedUrls.length > 0 && uploadedUrls.length === images.length && (
          <Text style={[styles.uploadDoneText, { color: c.textTertiary }]}>
            {uploadedUrls.length}장 업로드 완료
          </Text>
        )}
      </View>

      {/* 제출 버튼 */}
      <TouchableOpacity
        style={[
          styles.submitBtn,
          { backgroundColor: c.primary },
          (loading || isUploadPending) && { opacity: 0.5 },
        ]}
        onPress={handleSubmit}
        disabled={loading || isUploadPending}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : isUploadPending ? (
          <>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.submitText}>이미지 업로드 중...</Text>
          </>
        ) : (
          <>
            <Ionicons name="create" size={20} color="#fff" />
            <Text style={styles.submitText}>리뷰 등록</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.hint, { color: c.textDisabled }]}>
        태그, 한줄평, 사진으로 리뷰를 남겨주세요
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  placeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  placeName: { fontSize: 17, fontWeight: '600' },
  placeCategory: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: { fontSize: 13 },
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
  uploadDoneText: { fontSize: 12, marginTop: 8 },
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
  hint: { fontSize: 12, textAlign: 'center', marginTop: 12 },
});
