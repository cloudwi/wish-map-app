import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PlaceResult } from '../api/search';
import { useTheme } from '../hooks/useTheme';
import { lightTap } from '../utils/haptics';

interface PlaceDetailSheetProps {
  place: PlaceResult;
  onClose: () => void;
  onOpenNaverMap: (place: PlaceResult) => void;
  onCallPhone: (phone: string) => void;
}

export function PlaceDetailSheet({ place, onClose, onOpenNaverMap, onCallPhone }: PlaceDetailSheetProps) {
  const c = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.preview}>
      {/* 장소명 + 닫기 */}
      <View style={styles.previewHeader}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.placeName, { color: c.textPrimary }]}>{place.name}</Text>
          {place.category ? (
            <Text style={[styles.placeCategory, { color: c.textSecondary }]}>{place.category}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={[styles.previewClose, { backgroundColor: c.closeButtonBg }]} onPress={onClose}>
          <Ionicons name="close" size={20} color={c.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* 액션 버튼 */}
      <View style={[styles.placeActions, { borderBottomColor: c.divider }]}>
        <TouchableOpacity style={styles.placeActionBtn} onPress={() => onOpenNaverMap(place)}>
          <View style={[styles.placeActionIcon, { backgroundColor: c.successBg }]}>
            <Ionicons name="storefront-outline" size={20} color={c.success} />
          </View>
          <Text style={[styles.placeActionText, { color: c.textSecondary }]}>상세보기</Text>
        </TouchableOpacity>
        {place.phone ? (
          <TouchableOpacity style={styles.placeActionBtn} onPress={() => onCallPhone(place.phone)}>
            <View style={[styles.placeActionIcon, { backgroundColor: c.infoBg }]}>
              <Ionicons name="call-outline" size={20} color={c.info} />
            </View>
            <Text style={[styles.placeActionText, { color: c.textSecondary }]}>전화</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 주소 */}
      <View style={styles.placeInfoSection}>
        <View style={styles.placeInfoRow}>
          <Ionicons name="location-outline" size={18} color={c.textSecondary} />
          <Text style={[styles.placeInfoText, { color: c.textPrimary }]}>
            {place.roadAddress || place.address}
          </Text>
        </View>
        {place.phone ? (
          <View style={styles.placeInfoRow}>
            <Ionicons name="call-outline" size={18} color={c.textSecondary} />
            <Text style={[styles.placeInfoText, { color: c.textPrimary }]}>{place.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* 리뷰 */}
      <View style={[styles.placeReviewSection, { borderTopColor: c.divider }]}>
        <Text style={[styles.placeReviewTitle, { color: c.textPrimary }]}>리뷰</Text>
        <TouchableOpacity
          style={[styles.firstReviewBtn, { backgroundColor: c.reviewBtnBg, borderColor: c.reviewBtnBorder }]}
          onPress={() => {
            lightTap();
            // TODO: 리뷰 작성 화면으로 이동
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={c.primary} />
          <Text style={[styles.firstReviewText, { color: c.primary }]}>첫 리뷰 작성하기</Text>
          <Ionicons name="chevron-forward" size={16} color={c.textDisabled} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  preview: { flex: 1, paddingHorizontal: 16 },
  previewHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  previewClose: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  placeName: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  placeCategory: { fontSize: 13, marginBottom: 4 },
  placeActions: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  placeActionBtn: { alignItems: 'center', gap: 6 },
  placeActionIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  placeActionText: { fontSize: 12, fontWeight: '500' },
  placeInfoSection: { paddingVertical: 16, gap: 12 },
  placeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  placeInfoText: { fontSize: 14, flex: 1 },
  placeReviewSection: {
    borderTopWidth: 0.5,
    paddingTop: 16,
  },
  placeReviewTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  firstReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  firstReviewText: { flex: 1, fontSize: 14, fontWeight: '600' },
});
