import { create } from 'zustand';

interface ForceUpdateInfo {
  storeUrl: string;
  minVersion: string;
}

interface AppState {
  isReady: boolean;
  isMaintenance: boolean;
  forceUpdate: ForceUpdateInfo | null;
  /** 키보드 위 전역 X(닫기) 버튼 노출 억제 플래그. 모달이 자체 닫기 UI를 가질 때 true로 설정. */
  suppressKeyboardDoneBar: boolean;
  setReady: (v: boolean) => void;
  setMaintenance: (v: boolean) => void;
  setForceUpdate: (v: ForceUpdateInfo | null) => void;
  setSuppressKeyboardDoneBar: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  isMaintenance: false,
  forceUpdate: null,
  suppressKeyboardDoneBar: false,
  setReady: (v) => set({ isReady: v }),
  setMaintenance: (v) => set({ isMaintenance: v }),
  setForceUpdate: (v) => set({ forceUpdate: v }),
  setSuppressKeyboardDoneBar: (v) => set({ suppressKeyboardDoneBar: v }),
}));
