import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CATEGORY_STYLES: Record<string, { bg: string; accent: string; icon: string }> = {
  fish:            { bg: '#FFF3E0', accent: '#FF8A65', icon: 'fish' },           // 붕어빵
  flower:          { bg: '#FCE4EC', accent: '#F48FB1', icon: 'flower' },         // 벚꽃
  restaurant:      { bg: '#FBE9E7', accent: '#FF8A65', icon: 'restaurant' },     // 음식점
  cafe:            { bg: '#EFEBE9', accent: '#A1887F', icon: 'cafe' },           // 카페
  cart:            { bg: '#E8EAF6', accent: '#7986CB', icon: 'cart' },           // 쇼핑
  storefront:      { bg: '#E0F2F1', accent: '#80CBC4', icon: 'storefront' },     // 생활
  bed:             { bg: '#E3F2FD', accent: '#64B5F6', icon: 'bed' },            // 여행
  'color-palette': { bg: '#F3E5F5', accent: '#CE93D8', icon: 'color-palette' }, // 문화
  school:          { bg: '#E8F5E9', accent: '#81C784', icon: 'school' },         // 교육
  medkit:          { bg: '#E8F5E9', accent: '#66BB6A', icon: 'medkit' },         // 의료
};

const DEFAULT_STYLE = { bg: '#FBE9E7', accent: '#FF8A65', icon: 'restaurant' };

interface Props {
  icon?: string | null;
  size?: number;
  iconScale?: number;
}

export function CategoryPlaceholder({ icon, size = 90, iconScale = 0.4 }: Props) {
  const style = (icon && CATEGORY_STYLES[icon]) || DEFAULT_STYLE;
  const iconSize = Math.round(size * iconScale);

  return (
    <View style={[styles.container, { width: size, height: size, backgroundColor: style.bg }]}>
      <View style={[styles.circle, { width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3, backgroundColor: style.accent + '20' }]}>
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
