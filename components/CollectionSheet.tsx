import { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { LikeGroup } from '../types';
import { restaurantApi } from '../api/restaurant';
import { useTheme } from '../hooks/useTheme';
import { lightTap, successTap } from '../utils/haptics';
import { showError } from '../utils/toast';

interface CollectionSheetProps {
  bottomSheetRef: React.RefObject<BottomSheet | null>;
  restaurantId: number;
  onComplete: (isLiked: boolean, likeCount: number) => void;
}

export function CollectionSheet({ bottomSheetRef, restaurantId, onComplete }: CollectionSheetProps) {
  const c = useTheme();
  const [groups, setGroups] = useState<LikeGroup[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const data = await restaurantApi.getCollections(restaurantId);
      setGroups(data);
      const selected = new Set(data.filter(g => g.hasRestaurant).map(g => g.id));
      setSelectedIds(selected);
    } catch {
      showError('오류', '컬렉션을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const toggleGroup = (id: number) => {
    lightTap();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    try {
      setCreating(true);
      const group = await restaurantApi.createCollection(name);
      setGroups(prev => [...prev, group]);
      setSelectedIds(prev => new Set([...prev, group.id]));
      setNewGroupName('');
      successTap();
    } catch (error: any) {
      showError('오류', error?.response?.data?.message || '그룹 생성에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const handleConfirm = async () => {
    try {
      setSaving(true);
      const result = await restaurantApi.updateRestaurantCollections(
        restaurantId,
        Array.from(selectedIds)
      );
      successTap();
      onComplete(result.isLiked, result.likeCount);
      bottomSheetRef.current?.close();
    } catch {
      showError('오류', '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={['55%', '75%']}
      enablePanDownToClose
      backgroundStyle={[styles.sheetBg, { backgroundColor: c.sheetBg }]}
      handleIndicatorStyle={{ backgroundColor: c.textDisabled, width: 40 }}
    >
      <BottomSheetView style={styles.header}>
        <Text style={[styles.title, { color: c.textPrimary }]}>컬렉션에 저장</Text>
      </BottomSheetView>

      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator style={{ paddingVertical: 30 }} color={c.primary} />
        ) : (
          <>
            {groups.map(group => (
              <TouchableOpacity
                key={group.id}
                style={[styles.groupRow, { borderBottomColor: c.divider }]}
                onPress={() => toggleGroup(group.id)}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={selectedIds.has(group.id) ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={selectedIds.has(group.id) ? c.primary : c.textDisabled}
                />
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: c.textPrimary }]}>{group.name}</Text>
                  <Text style={[styles.groupCount, { color: c.textTertiary }]}>{group.restaurantCount}개</Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* 새 그룹 만들기 */}
            <View style={[styles.newGroupRow, { borderBottomColor: c.divider }]}>
              <Ionicons name="add-circle-outline" size={24} color={c.primary} />
              <TextInput
                style={[styles.newGroupInput, { color: c.textPrimary }]}
                placeholder="새 컬렉션 이름"
                placeholderTextColor={c.textDisabled}
                value={newGroupName}
                onChangeText={setNewGroupName}
                returnKeyType="done"
                onSubmitEditing={handleCreateGroup}
              />
              {creating ? (
                <ActivityIndicator size="small" color={c.primary} />
              ) : newGroupName.trim() ? (
                <TouchableOpacity onPress={handleCreateGroup}>
                  <Text style={[styles.createBtn, { color: c.primary }]}>추가</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </>
        )}
      </BottomSheetScrollView>

      <View style={[styles.footer, { borderTopColor: c.divider, backgroundColor: c.sheetBg }]}>
        <TouchableOpacity
          style={[styles.confirmBtn, saving && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmBtnText}>확인</Text>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  sheetBg: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 0.5,
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupName: {
    fontSize: 15,
    fontWeight: '500',
  },
  groupCount: {
    fontSize: 13,
  },
  newGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 0.5,
  },
  newGroupInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  createBtn: {
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 0.5,
  },
  confirmBtn: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
