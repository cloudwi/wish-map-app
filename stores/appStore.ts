import { create } from 'zustand';

interface ForceUpdateInfo {
  storeUrl: string;
  minVersion: string;
}

interface AppState {
  isReady: boolean;
  isMaintenance: boolean;
  forceUpdate: ForceUpdateInfo | null;
  setReady: (v: boolean) => void;
  setMaintenance: (v: boolean) => void;
  setForceUpdate: (v: ForceUpdateInfo | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  isMaintenance: false,
  forceUpdate: null,
  setReady: (v) => set({ isReady: v }),
  setMaintenance: (v) => set({ isMaintenance: v }),
  setForceUpdate: (v) => set({ forceUpdate: v }),
}));
