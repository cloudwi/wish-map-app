import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useGroupStore } from '../../stores/groupStore';
import { lightTap } from '../../utils/haptics';

interface GroupChipProps {
  top: number;
}

export function GroupChip({ top }: GroupChipProps) {
  const c = useTheme();
  const { isAuthenticated } = useAuthStore();
  const { groups, selectedGroupId } = useGroupStore();

  if (!isAuthenticated) return null;

  const selectedGroup = selectedGroupId ? groups.find(g => g.id === selectedGroupId) : null;

  return (
    <View style={[styles.groupChips, { top }]}>
      <View style={{ paddingHorizontal: 16 }}>
        {selectedGroup ? (
          <TouchableOpacity
            style={[styles.groupChip, { backgroundColor: c.primary + '15', borderColor: c.primary, alignSelf: 'flex-start' }]}
            onPress={() => { lightTap(); router.push('/group-manage'); }}
            activeOpacity={0.7}
          >
            <Ionicons name="people" size={13} color={c.primary} />
            <Text style={[styles.groupChipText, { color: c.primary }]}>
              {selectedGroup.name}
            </Text>
            <Ionicons name="chevron-down" size={12} color={c.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.groupChip, { backgroundColor: c.surface, borderColor: c.border, alignSelf: 'flex-start' }]}
            onPress={() => { lightTap(); router.push('/group-manage'); }}
            activeOpacity={0.7}
          >
            <Ionicons name="people-outline" size={13} color={c.textTertiary} />
            <Text style={[styles.groupChipText, { color: c.textTertiary }]}>
              {groups.length > 0 ? '그룹 선택' : '+ 그룹 만들기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  groupChips: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  groupChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
