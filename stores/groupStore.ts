import { create } from 'zustand';
import { groupApi, GroupResponse } from '../api/group';

interface GroupState {
  groups: GroupResponse[];
  selectedGroupId: number | null;
  loading: boolean;
  fetchGroups: () => Promise<void>;
  selectGroup: (groupId: number | null) => void;
  createGroup: (name: string) => Promise<GroupResponse>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  groups: [],
  selectedGroupId: null,
  loading: false,

  fetchGroups: async () => {
    set({ loading: true });
    try {
      const groups = await groupApi.getMyGroups();
      set({ groups });
    } catch {
      // 미로그인 시 빈 배열
      set({ groups: [] });
    } finally {
      set({ loading: false });
    }
  },

  selectGroup: (groupId) => {
    set({ selectedGroupId: groupId === get().selectedGroupId ? null : groupId });
  },

  createGroup: async (name) => {
    const group = await groupApi.createGroup(name);
    set((s) => ({ groups: [...s.groups, group] }));
    return group;
  },
}));
