import { ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle, StyleProp, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { WishInput } from './WishInput';

interface SearchInputProps
  extends Omit<TextInputProps, 'style' | 'onChangeText' | 'value' | 'placeholder'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onClear?: () => void;
  rightAdornment?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  size?: 'sm' | 'md';
}

/**
 * 앱 표준 검색바.
 * - 돋보기 아이콘 + WishInput + clear 버튼(값 있을 때)
 * - 오른쪽 커스텀 요소(필터 버튼 등) 추가 가능
 * - `size`: sm(44) / md(48)
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder,
  onClear,
  rightAdornment,
  containerStyle,
  size = 'md',
  ...rest
}: SearchInputProps) {
  const c = useTheme();
  const isSmall = size === 'sm';
  const iconSize = isSmall ? 17 : 18;

  const handleClear = () => {
    if (onClear) onClear();
    else onChangeText('');
  };

  return (
    <View
      style={[
        styles.bar,
        isSmall ? styles.barSm : styles.barMd,
        { backgroundColor: c.searchBg },
        containerStyle,
      ]}
    >
      <Ionicons name="search-outline" size={iconSize} color={c.textTertiary} />
      <WishInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={c.textDisabled}
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        {...rest}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} hitSlop={8}>
          <Ionicons name="close-circle" size={iconSize} color={c.textDisabled} />
        </TouchableOpacity>
      )}
      {rightAdornment}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  barSm: {
    height: 44,
  },
  barMd: {
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
});
