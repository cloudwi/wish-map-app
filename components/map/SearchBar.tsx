import { StyleSheet, View, Text, TextInput, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceResult } from '../../api/search';
import { useTheme } from '../../hooks/useTheme';

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
}: SearchBarProps) {
  const c = useTheme();
  const showResults = searchResults.length > 0;

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
          onFocus={onFocus}
          onBlur={onBlur}
          returnKeyType="search"
          onSubmitEditing={onSearchNow}
        />
        {searching && <ActivityIndicator size="small" color={c.primary} />}
        {searchQuery.length > 0 && !searching && (
          <TouchableOpacity onPress={onClearSearch} style={styles.clearBtn}>
            <Ionicons name="close-circle" size={18} color={c.textDisabled} />
          </TouchableOpacity>
        )}
      </View>

      {showResults && (
        <View style={[styles.searchResults, { backgroundColor: c.surface }]}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
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
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 0 },
  clearBtn: { padding: 8 },
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
});
