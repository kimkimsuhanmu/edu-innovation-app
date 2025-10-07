import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firebaseService, { Content } from '../services/firebase';
import ContentCard from '../components/ContentCard';

/**
 * 카테고리 화면 컴포넌트
 * 직무별 카테고리와 해당 카테고리의 콘텐츠를 표시합니다.
 */
const CategoryScreen: React.FC = () => {
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /**
   * 카테고리 목록 로드
   */
  const loadCategories = async () => {
    try {
      const result = await firebaseService.content.getCategories();
      if (result.success && result.categories) {
        setCategories(result.categories);
      }
    } catch (error: any) {
      console.error('카테고리 로드 에러:', error);
    }
  };

  /**
   * 특정 카테고리의 콘텐츠 로드
   */
  const loadCategoryContents = async (category: string) => {
    try {
      setLoading(true);
      const result = await firebaseService.content.getContentsByCategory(category);
      if (result.success && result.contents) {
        setContents(result.contents);
      }
    } catch (error: any) {
      console.error('카테고리 콘텐츠 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 새로고침
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCategories();
    if (selectedCategory) {
      await loadCategoryContents(selectedCategory);
    }
    setRefreshing(false);
  };

  /**
   * 카테고리 선택 핸들러
   */
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    loadCategoryContents(category);
  };

  /**
   * 콘텐츠 선택 핸들러
   */
  const handleContentPress = (contentId: string) => {
    // PlayerScreen으로 이동
    // navigation.navigate('Player', { contentId });
    console.log('콘텐츠 선택:', contentId);
  };

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadCategories();
  }, []);

  /**
   * 카테고리 렌더링
   */
  const renderCategory = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        selectedCategory === item && styles.categoryItemSelected
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <Text style={[
        styles.categoryText,
        selectedCategory === item && styles.categoryTextSelected
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  );

  /**
   * 콘텐츠 렌더링
   */
  const renderContent = ({ item }: { item: Content }) => (
    <ContentCard
      content={item}
      onPress={() => handleContentPress(item.id)}
    />
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>카테고리별 콘텐츠</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* 카테고리 목록 */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* 콘텐츠 목록 */}
      <View style={styles.contentContainer}>
        {selectedCategory ? (
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>콘텐츠를 불러오는 중...</Text>
            </View>
          ) : contents.length > 0 ? (
            <FlatList
              data={contents}
              renderItem={renderContent}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.contentRow}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                '{selectedCategory}' 카테고리에 콘텐츠가 없습니다.
              </Text>
            </View>
          )
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              카테고리를 선택해주세요.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryContainer: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
  },
  categoryList: {
    paddingHorizontal: 16,
  },
  categoryItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  categoryItemSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  contentRow: {
    justifyContent: 'space-between',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CategoryScreen;