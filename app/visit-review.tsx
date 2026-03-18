import { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, TextInput,
  ScrollView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { restaurantApi } from '../api/restaurant';
import { lightTap, successTap, mediumTap } from '../utils/haptics';
import { showError } from '../utils/toast';
import { getErrorMessage } from '../utils/getErrorMessage';

const TAGS = [
  { label: '맛있어요', emoji: '😋' },
  { label: '분위기 좋아요', emoji: '✨' },
  { label: '가성비 좋아요', emoji: '💰' },
  { label: '친절해요', emoji: '😊' },
  { label: '재방문 의사', emoji: '🔄' },
  { label: '혼밥 가능', emoji: '🧑' },
  { label: '데이트 추천', emoji: '💕' },
  { label: '주차 가능', emoji: '🅿️' },
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
        quality: 0.8,
      });
      if (!result.canceled) {
        setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 5));
      }
    } catch {
      Alert.alert('알림', '사진 기능은 네이티브 빌드에서만 사용 가능합니다.');
    }
  };

  const removeImage = (index: number) => {
    lightTap();
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const buildReviewText = () => {
    const parts: string[] = [];
    if (selectedTags.length > 0) parts.push(selectedTags.map(t => `#${t}`).join(' '));
    if (comment.trim()) parts.push(comment.trim());
    return parts.join('\n') || undefined;
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      mediumTap();

      const Location = require('expo-location') as typeof import('expo-location');
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });

      await restaurantApi.quickVisit({
        name: params.placeName,
        lat: Number(params.placeLat),
        lng: Number(params.placeLng),
        naverPlaceId: params.placeId || undefined,
        category: params.placeCategory || undefined,
        userLat: loc.coords.latitude,
        userLng: loc.coords.longitude,
        comment: buildReviewText(),
      });

      successTap();
      router.back();
      setTimeout(() => {
        Alert.alert('맛집 제보 완료!', '제보가 등록되었습니다.');
      }, 300);
    } catch (error: unknown) {
      showError('제보 실패', getErrorMessage(error, '맛집 제보 중 오류가 발생했습니다.'));
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
      <Animated.View entering={FadeIn.duration(300)} style={[styles.placeCard, { backgroundColor: c.cardBg }]}>
        <Ionicons name="location" size={20} color={c.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.placeName, { color: c.textPrimary }]}>{params.placeName}</Text>
          {params.placeCategory ? (
            <Text style={[styles.placeCategory, { color: c.textTertiary }]}>{params.placeCategory}</Text>
          ) : null}
        </View>
      </Animated.View>

      {/* 태그 */}
      <Animated.View entering={FadeIn.delay(100).duration(300)} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>태그</Text>
        <View style={styles.tagGrid}>
          {TAGS.map((tag) => {
            const isSelected = selectedTags.includes(tag.label);
            return (
              <TouchableOpacity
                key={tag.label}
                style={[
                  styles.tagChip,
                  { backgroundColor: c.chipBg, borderColor: c.border },
                  isSelected && { backgroundColor: c.primary + '15', borderColor: c.primary },
                ]}
                onPress={() => toggleTag(tag.label)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 14 }}>{tag.emoji}</Text>
                <Text style={[
                  styles.tagText,
                  { color: c.textSecondary },
                  isSelected && { color: c.primary, fontWeight: '600' },
                ]}>
                  {tag.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* 한줄 리뷰 */}
      <Animated.View entering={FadeIn.delay(200).duration(300)} style={styles.section}>
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
      </Animated.View>

      {/* 사진 */}
      <Animated.View entering={FadeIn.delay(300).duration(300)} style={styles.section}>
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
          {images.length < 5 && (
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
      </Animated.View>

      {/* 제출 버튼 */}
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: c.primary }, loading && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Ionicons name="megaphone" size={20} color="#fff" />
            <Text style={styles.submitText}>제보하기</Text>
          </>
        )}
      </TouchableOpacity>

      <Text style={[styles.hint, { color: c.textDisabled }]}>
        태그, 리뷰, 사진으로 맛집을 제보해주세요
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
    borderRadius: 16,
    marginBottom: 20,
  },
  placeName: { fontSize: 17, fontWeight: '700' },
  placeCategory: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  tagGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontSize: 13 },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    minHeight: 80,
  },
  charCount: { fontSize: 12, textAlign: 'right', marginTop: 4 },
  imageRow: { gap: 10 },
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
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 8,
  },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 12 },
});
