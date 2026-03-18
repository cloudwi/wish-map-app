import { create } from 'zustand';
import { setItem, getItem } from '../utils/secureStorage';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  loadMode: () => Promise<void>;
}

const THEME_KEY = 'wishmap_theme_mode';

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'system',
  setMode: (mode) => {
    set({ mode });
    setItem(THEME_KEY, mode);
  },
  loadMode: async () => {
    const saved = await getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      set({ mode: saved });
    }
  },
}));
