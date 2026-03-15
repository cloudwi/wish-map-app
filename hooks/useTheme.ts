import { useColorScheme } from 'react-native';
import { themes, type ThemeColors } from '../constants/theme';

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? themes.dark : themes.light;
}
