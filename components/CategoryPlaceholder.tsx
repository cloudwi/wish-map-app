import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

interface CategoryStyle { bg: string; darkBg: string; accent: string; icon: string }

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  fish:            { bg: '#FFF3E0', darkBg: '#3D2B1A', accent: '#FF8A65', icon: 'fish' },
  flower:          { bg: '#FFF0F3', darkBg: '#3D1F28', accent: '#F48FB1', icon: 'flower' },
  restaurant:      { bg: '#FFF5F0', darkBg: '#3D261A', accent: '#FF8A65', icon: 'restaurant' },
  cafe:            { bg: '#FDF5F0', darkBg: '#352A24', accent: '#C4956A', icon: 'cafe' },
  cart:            { bg: '#F5F0FF', darkBg: '#2A2640', accent: '#9B8EC4', icon: 'cart' },
  storefront:      { bg: '#F0FBF5', darkBg: '#1E3328', accent: '#7DBFA0', icon: 'storefront' },
  bed:             { bg: '#F0F6FF', darkBg: '#1E2A3D', accent: '#7EAED4', icon: 'bed' },
  'color-palette': { bg: '#FBF0FF', darkBg: '#331E3D', accent: '#C48DD4', icon: 'color-palette' },
  school:          { bg: '#F0FFF5', darkBg: '#1E3322', accent: '#81C784', icon: 'school' },
  medkit:          { bg: '#F0FFF5', darkBg: '#1E3322', accent: '#66BB6A', icon: 'medkit' },
};

const DEFAULT_STYLE: CategoryStyle = { bg: '#FFF5F0', darkBg: '#3D261A', accent: '#FF8A65', icon: 'restaurant' };

interface Props {
  icon?: string | null;
  size?: number;
  iconScale?: number;
}

export function CategoryPlaceholder({ icon, size = 90, iconScale = 0.4 }: Props) {
  const c = useTheme();
  const isDark = c.background === '#121212';
  const style = (icon && CATEGORY_STYLES[icon]) || DEFAULT_STYLE;
  const bgColor = isDark ? style.darkBg : style.bg;
  const iconSize = Math.round(size * iconScale);

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: bgColor }]}>
      <View style={[styles.circle, { width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, backgroundColor: style.accent + (isDark ? '25' : '18') }]}>
        <Ionicons name={style.icon as any} size={iconSize} color={style.accent} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
