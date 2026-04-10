import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, ActivityIndicator, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceResult } from '../../api/search';
import { useTheme } from '../../hooks/useTheme';
import { lightTap } from '../../utils/haptics';
import { PlaceCategory } from '../../types';

interface SearchBarProps {
  top: number;
  searchQuery: string;
  searchResults: PlaceResult[];
  searching: boolean;
  onSearch: (text: string) => void;
  onSearchNow: () => void;
  onClearSearch: () => void;
  onSelectPlace: (place: PlaceResult) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeCategories: PlaceCategory[];
  selectedCategoryId: number | null;
  onCategoryChange: (categoryId: number | null) => void;
  onRegisterCustomPlace?: (categoryId: number, categoryName: string) => void;
}

export function SearchBar({
  top,
  searchQuery,
  searchResults,
  searching,
  onSearch,
  onSearchNow,
  onClearSearch,
  onSelectPlace,
  onFocus,
  onBlur,
  placeCategories,
  selectedCategoryId,
  onCategoryChange,
  onRegisterCustomPlace,
}: SearchBarProps) {
  const c = useTheme();
  const showResults = searchResults.length > 0;
  const hasCustomCategories = placeCategories.some(cat => cat.customOnly);
  const showCustomRegister = searchQuery.trim().length > 0 && !searching && hasCustomCategories;
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const selectedCategory = placeCategories.find(c => c.id === selectedCategoryId);

  const handleCategoryPress = () => {
    lightTap();
    setCategoryDropdownOpen(prev => !prev);
  };

  const handleCategorySelect = (id: number | null) => {
    lightTap();
    onCategoryChange(id);
    setCategoryDropdownOpen(false);
  };

  return (
    <View style={[styles.searchContainer, { top }]}>
      <View style={[styles.searchBar, { backgroundColor: c.surface, shadowColor: '#000' }]}>
        <Ionicons name="search-outline" size={20} color={c.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: c.textPrimary }]}
          placeholder="장소 검색"
          placeholderTextColor={c.textSecondary}
          value={searchQuery}
          onChangeText={onSearch}
          onFocus={() => { setCategoryDropdownOpen(false); onFocus?.(); }}
          onBlur={onBlur}
          returnKeyType="search"
          onSubmitEditing={onSearchNow}
          autoCorrect={false}
          autoComplete="off"
        />
        {searching && <ActivityIndicator size="small" color={c.primary} />}
        {searchQuery.length > 0 && !searching && (
          <TouchableOpacity onPress={onClearSearch} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={c.textDisabled} />
          </TouchableOpacity>
        )}

        {/* 카테고리 필터 버튼 */}
        <TouchableOpacity
          style={[
            styles.filterBtn,
            { borderColor: c.border, backgroundColor: c.searchBg },
            selectedCategoryId != null && { borderColor: c.primary, backgroundColor: c.primaryBg },
          ]}
          onPress={handleCategoryPress}
          activeOpacity={0.7}
        >
          {selectedCategoryId != null ? (
            <Text style={[styles.filterLabel, { color: c.primary }]} numberOfLines={1}>
              {selectedCategory?.name || ''}
            </Text>
          ) : (
            <Ionicons name="grid-outline" size={15} color={c.textSecondary} />
          )}
          <Ionicons
            name={categoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={12}
            color={selectedCategoryId != null ? c.primary : c.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* 카테고리 드롭다운 */}
      {categoryDropdownOpen && (
        <View style={[styles.dropdown, { backgroundColor: c.surface, shadowColor: '#000' }]}>
          <ScrollView style={styles.dropdownScroll} bounces={false}>
            <TouchableOpacity
              style={[styles.dropdownItem, { borderBottomColor: c.divider }]}
              onPress={() => handleCategorySelect(null)}
              activeOpacity={0.6}
            >
              <Text style={[
                styles.dropdownText,
                { color: c.textPrimary },
                selectedCategoryId == null && { color: c.primary, fontWeight: '600' },
              ]}>전체</Text>
              {selectedCategoryId == null && <Ionicons name="checkmark" size={16} color={c.primary} />}
            </TouchableOpacity>
            {[...placeCategories].sort((a, b) => (b.customOnly ? 1 : 0) - (a.customOnly ? 1 : 0)).map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.dropdownItem, { borderBottomColor: c.divider }]}
                  onPress={() => handleCategorySelect(cat.id)}
                  activeOpacity={0.6}
                >
                  <Text style={[
                    styles.dropdownText,
                    { color: c.textPrimary },
                    isSelected && { color: c.primary, fontWeight: '600' },
                  ]}>
                    {cat.name}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={16} color={c.primary} />}
                </TouchableOpacity>
              );
            })}
            {selectedCategoryId != null && (
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomWidth: 0 }]}
                onPress={() => handleCategorySelect(null)}
                activeOpacity={0.6}
              >
                <Text style={[styles.dropdownText, { color: c.error }]}>필터 해제</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      )}

      {(showResults || showCustomRegister) && !categoryDropdownOpen && (
        <View style={[styles.searchResults, { backgroundColor: c.surface }]}>
          <FlatList
            data={searchResults}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={showCustomRegister && onRegisterCustomPlace ? (
              <View style={[styles.customRegisterSection, { borderBottomColor: searchResults.length > 0 ? c.divider : 'transparent' }]}>
                <Text style={[styles.customRegisterTitle, { color: c.textSecondary }]}>현재 위치에 직접 등록</Text>
                <View style={styles.categoryChips}>
                  {placeCategories.filter(cat => cat.customOnly).map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, { backgroundColor: c.primaryBg, borderColor: c.primary }]}
                      onPress={() => { lightTap(); onRegisterCustomPlace(cat.id, cat.name); }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.categoryChipText, { color: c.primary }]}>{cat.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                style={[styles.resultItem, { borderBottomColor: c.divider }, index === searchResults.length - 1 && styles.resultItemLast]}
                onPress={() => onSelectPlace(item)}
                activeOpacity={0.6}
              >
                <Ionicons name="location-outline" size={18} color={c.primary} />
                <View style={styles.resultContent}>
                  <Text style={[styles.resultName, { color: c.textPrimary }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.resultAddress, { color: c.textSecondary }]} numberOfLines={1}>
                    {item.roadAddress || item.address}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 48,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 0 },
  clearBtn: { padding: 8 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  dropdown: {
    marginTop: 6,
    borderRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    maxHeight: 360,
  },
  dropdownScroll: {
    flexGrow: 0,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchResults: {
    marginTop: 6,
    borderRadius: 8,
    maxHeight: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 0.5,
  },
  resultItemLast: { borderBottomWidth: 0 },
  resultContent: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  resultAddress: { fontSize: 13 },
  customRegisterSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  customRegisterTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
