import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { PlaceResult } from '../api/search';
import { lightTap } from '../utils/haptics';

interface PlaceDetailSheetProps {
  place: PlaceResult;
  onClose: () => void;
  onOpenNaverMap: (place: PlaceResult) => void;
  onCallPhone: (phone: string) => void;
}

export function PlaceDetailSheet({ place, onClose, onOpenNaverMap, onCallPhone }: PlaceDetailSheetProps) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.preview}>
      {/* 장소명 + 닫기 */}
      <View style={styles.previewHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.placeName}>{place.name}</Text>
          {place.category ? (
            <Text style={styles.placeCategory}>{place.category}</Text>
          ) : null}
        </View>
        <TouchableOpacity style={styles.previewClose} onPress={onClose}>
          <Ionicons name="close" size={20} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 액션 버튼 */}
      <View style={styles.placeActions}>
        <TouchableOpacity style={styles.placeActionBtn} onPress={() => onOpenNaverMap(place)}>
          <View style={[styles.placeActionIcon, { backgroundColor: '#E8F5E9' }]}>
            <Ionicons name="storefront-outline" size={20} color="#1EC800" />
          </View>
          <Text style={styles.placeActionText}>상세보기</Text>
        </TouchableOpacity>
        {place.phone ? (
          <TouchableOpacity style={styles.placeActionBtn} onPress={() => onCallPhone(place.phone)}>
            <View style={[styles.placeActionIcon, { backgroundColor: '#E3F2FD' }]}>
              <Ionicons name="call-outline" size={20} color="#2196F3" />
            </View>
            <Text style={styles.placeActionText}>전화</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* 주소 */}
      <View style={styles.placeInfoSection}>
        <View style={styles.placeInfoRow}>
          <Ionicons name="location-outline" size={18} color="#888" />
          <Text style={styles.placeInfoText}>
            {place.roadAddress || place.address}
          </Text>
        </View>
        {place.phone ? (
          <View style={styles.placeInfoRow}>
            <Ionicons name="call-outline" size={18} color="#888" />
            <Text style={styles.placeInfoText}>{place.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* 리뷰 */}
      <View style={styles.placeReviewSection}>
        <Text style={styles.placeReviewTitle}>리뷰</Text>
        <TouchableOpacity
          style={styles.firstReviewBtn}
          onPress={() => {
            lightTap();
            // TODO: 리뷰 작성 화면으로 이동
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FF6B35" />
          <Text style={styles.firstReviewText}>첫 리뷰 작성하기</Text>
          <Ionicons name="chevron-forward" size={16} color="#ccc" />
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
    backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center',
  },
  placeName: { fontSize: 20, fontWeight: '700', color: '#191F28', marginBottom: 4 },
  placeCategory: { fontSize: 13, color: '#888', marginBottom: 4 },
  placeActions: {
    flexDirection: 'row',
    gap: 24,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  placeActionBtn: { alignItems: 'center', gap: 6 },
  placeActionIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
  },
  placeActionText: { fontSize: 12, color: '#555', fontWeight: '500' },
  placeInfoSection: { paddingVertical: 16, gap: 12 },
  placeInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  placeInfoText: { fontSize: 14, color: '#333', flex: 1 },
  placeReviewSection: {
    borderTopWidth: 0.5,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  placeReviewTitle: { fontSize: 16, fontWeight: '700', color: '#191F28', marginBottom: 12 },
  firstReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8F5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#FFE0D0',
  },
  firstReviewText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#FF6B35' },
});
