import { useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Restaurant } from '../types';
import { useTheme } from '../hooks/useTheme';
import { successTap, mediumTap } from '../utils/haptics';

const ITEM_HEIGHT = 44;
const SLOT_HEIGHT = ITEM_HEIGHT;

interface RecommendSlotProps {
  visible: boolean;
  candidates: Restaurant[];
  winner: Restaurant | null;
  onResult: (restaurant: Restaurant) => void;
  onClose: () => void;
}

export function RecommendSlot({ visible, candidates, winner, onResult, onClose }: RecommendSlotProps) {
  const c = useTheme();
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const resultOpacity = useSharedValue(0);
  const resultScale = useSharedValue(0.8);
  const spinning = useRef(false);

  // 슬롯에 표시할 아이템 (후보를 여러번 반복 + 마지막에 winner)
  const slotItems = (() => {
    if (!candidates.length || !winner) return [];
    const repeats = 4; // 4바퀴 돌기
    const items: Restaurant[] = [];
    for (let i = 0; i < repeats; i++) {
      // 매 반복마다 셔플
      const shuffled = [...candidates].sort(() => Math.random() - 0.5);
      items.push(...shuffled);
    }
    items.push(winner); // 마지막에 당첨 장소
    return items;
  })();

  const totalHeight = slotItems.length * ITEM_HEIGHT;
  const targetY = -(totalHeight - ITEM_HEIGHT); // 마지막 아이템(winner)에 멈춤

  const onSpinComplete = useCallback(() => {
    spinning.current = false;
    successTap();
    // 결과 카드 애니메이션
    resultOpacity.value = withTiming(1, { duration: 300 });
    resultScale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.5)) });
  }, [resultOpacity, resultScale]);

  useEffect(() => {
    if (visible && slotItems.length > 0 && !spinning.current) {
      spinning.current = true;
      // 초기화
      translateY.value = 0;
      resultOpacity.value = 0;
      resultScale.value = 0.8;

      // 페이드 인
      opacity.value = withTiming(1, { duration: 200 });

      // 슬롯 애니메이션: 빠르게 → 감속
      translateY.value = withDelay(
        300,
        withSequence(
          // 빠르게 돌기 (전체의 60%까지)
          withTiming(targetY * 0.6, {
            duration: 1200,
            easing: Easing.in(Easing.linear),
          }),
          // 감속하며 멈추기 (나머지 40%)
          withTiming(targetY, {
            duration: 1200,
            easing: Easing.out(Easing.cubic),
          }, () => {
            runOnJS(onSpinComplete)();
          }),
        ),
      );
    }
  }, [visible, slotItems.length]);

  const slotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const resultCardStyle = useAnimatedStyle(() => ({
    opacity: resultOpacity.value,
    transform: [{ scale: resultScale.value }],
  }));

  const handleGoTo = () => {
    if (winner) {
      mediumTap();
      onResult(winner);
    }
  };

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 150 });
    setTimeout(onClose, 150);
  };

  if (!visible || !winner) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <Animated.View style={[styles.overlay, overlayStyle]}>
        <TouchableOpacity style={styles.overlayTouch} activeOpacity={1} onPress={handleClose}>
          <View />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* 슬롯 영역 */}
          <View style={[styles.slotContainer, { backgroundColor: c.surface }]}>
            <View style={styles.slotTitleRow}>
              <Ionicons name="dice-outline" size={20} color={c.primary} />
              <Text style={[styles.slotTitle, { color: c.textPrimary }]}>오늘의 메뉴</Text>
            </View>
            <View style={[styles.slotWindow, { borderColor: c.primary }]}>
              <Animated.View style={[styles.slotReel, slotStyle]}>
                {slotItems.map((item, index) => (
                  <View key={`${item.id}-${index}`} style={styles.slotItem}>
                    <Text style={[styles.slotItemName, { color: c.textPrimary }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            </View>
          </View>

          {/* 결과 카드 */}
          <Animated.View style={[styles.resultCard, { backgroundColor: c.surface }, resultCardStyle]}>
            <View style={styles.resultInfo}>
              <Text style={[styles.resultName, { color: c.textPrimary }]}>{winner.name}</Text>
              <View style={styles.resultMeta}>
                {winner.category && (
                  <View style={[styles.resultBadge, { backgroundColor: c.categoryBadgeBg }]}>
                    <Text style={[styles.resultBadgeText, { color: c.categoryBadgeText }]}>{winner.category}</Text>
                  </View>
                )}
                {winner.visitCount > 0 && (
                  <Text style={[styles.resultVisit, { color: c.textSecondary }]}>방문 {winner.visitCount}회</Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.goButton, { backgroundColor: c.primary }]}
              onPress={handleGoTo}
              activeOpacity={0.85}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.goButtonText}>여기로 가기</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    width: '85%',
    alignItems: 'center',
    gap: 16,
  },
  slotContainer: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  slotTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  slotWindow: {
    width: '100%',
    height: SLOT_HEIGHT,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  slotReel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  slotItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  slotItemName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  slotItemCategory: {
    fontSize: 12,
    marginTop: 2,
  },
  resultCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  resultInfo: {
    alignItems: 'center',
    gap: 8,
  },
  resultName: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  resultBadgeText: {
    fontSize: 12,
  },
  resultVisit: {
    fontSize: 13,
    fontWeight: '600',
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
  },
  goButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
