import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * SearchBar 컴포넌트 props 타입 정의
 */
interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  style?: object;
}

/**
 * 검색 바 컴포넌트
 * 
 * 사용자가 콘텐츠를 검색할 수 있는 입력 필드를 제공합니다.
 */
const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = '콘텐츠 검색',
  style
}) => {
  const [query, setQuery] = useState('');

  /**
   * 검색어 변경 핸들러
   */
  const handleChangeText = (text: string) => {
    setQuery(text);
  };

  /**
   * 검색 실행 핸들러
   */
  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  /**
   * 검색어 초기화 핸들러
   */
  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor="#999"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 46,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
});

export default SearchBar;
