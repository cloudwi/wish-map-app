import { useColorScheme } from 'react-native';
import { themes, type ThemeColors } from '../constants/theme';
import { useThemeStore } from '../stores/themeStore';

export function useTheme(): ThemeColors {
  const systemScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);

  const resolvedScheme = mode === 'system' ? systemScheme : mode;
  return resolvedScheme === 'dark' ? themes.dark : themes.light;
}
