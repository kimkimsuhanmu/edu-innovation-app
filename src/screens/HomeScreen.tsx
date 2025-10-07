import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../state/AuthContext';
import firebaseService, { Content, favoriteService } from '../services/firebase';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import ContentSection from '../components/ContentSection';
import eventBus, { EVENTS } from '../utils/EventBus';

/**
 * 홈 화면 컴포넌트
 * 
 * PRD F-02 명세에 따라 구현:
 * 1. 최신 콘텐츠, 인기 콘텐츠, 추천 콘텐츠 섹션 표시
 * 2. 직무별 카테고리 필터링
 * 3. 키워드 검색 기능
 */
const HomeScreen: React.FC = () => {
  // 내비게이션 훅
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // 인증 컨텍스트
  const { user } = useAuth();
  
  // 상태 관리
  const [latestContents, setLatestContents] = useState<Content[]>([]);
  const [popularContents, setPopularContents] = useState<Content[]>([]);
  const [recommendedContents, setRecommendedContents] = useState<Content[]>([]);
  const [searchResults, setSearchResults] = useState<Content[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryContents, setCategoryContents] = useState<Content[]>([]);
  
  const [isLatestLoading, setIsLatestLoading] = useState<boolean>(true);
  const [isPopularLoading, setIsPopularLoading] = useState<boolean>(true);
  const [isRecommendedLoading, setIsRecommendedLoading] = useState<boolean>(true);
  const [isCategoryLoading, setIsCategoryLoading] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // 정렬 방식 상태
  const [sortMode, setSortMode] = useState<'latest' | 'popular' | 'recommended' | 'favorites'>('latest');
  
  // 즐겨찾기 콘텐츠 상태
  const [favoriteContents, setFavoriteContents] = useState<Content[]>([]);
  const [isFavoritesLoading, setIsFavoritesLoading] = useState<boolean>(false);

  /**
   * 최신 콘텐츠 불러오기
   */
  const fetchLatestContents = async () => {
    setIsLatestLoading(true);
    try {
      const result = await firebaseService.content.getLatestContents(10);
      if (result.success) {
        setLatestContents(result.contents || []);
      } else {
        console.error('최신 콘텐츠 로딩 실패:', result.error);
      }
    } catch (error) {
      console.error('최신 콘텐츠 로딩 에러:', error);
    } finally {
      setIsLatestLoading(false);
    }
  };

  /**
   * 인기 콘텐츠 불러오기
   */
  const fetchPopularContents = async () => {
    setIsPopularLoading(true);
    try {
      const result = await firebaseService.content.getPopularContents(10);
      if (result.success) {
        setPopularContents(result.contents || []);
      } else {
        console.error('인기 콘텐츠 로딩 실패:', result.error);
      }
    } catch (error) {
      console.error('인기 콘텐츠 로딩 에러:', error);
    } finally {
      setIsPopularLoading(false);
    }
  };

  /**
   * 추천 콘텐츠 불러오기
   * 사용자의 학습 기록을 기반으로 추천 콘텐츠를 가져옵니다.
   */
  const fetchRecommendedContents = async () => {
    setIsRecommendedLoading(true);
    try {
      // 추천순 = 추천수(likeCount) 기준으로 정렬
      const result = await firebaseService.content.getContentsByLikeCount(5);
      
      if (result.success) {
        setRecommendedContents(result.contents || []);
      } else {
        console.error('추천 콘텐츠 로딩 실패:', result.error);
        // 실패 시 최신 콘텐츠로 대체
        const fallbackResult = await firebaseService.content.getLatestContents(5);
        if (fallbackResult.success) {
          setRecommendedContents(fallbackResult.contents || []);
        }
      }
    } catch (error) {
      console.error('추천 콘텐츠 로딩 에러:', error);
      // 에러 시 최신 콘텐츠로 대체
      try {
        const fallbackResult = await firebaseService.content.getLatestContents(5);
        if (fallbackResult.success) {
          setRecommendedContents(fallbackResult.contents || []);
        }
      } catch (fallbackError) {
        console.error('대체 콘텐츠 로딩 에러:', fallbackError);
      }
    } finally {
      setIsRecommendedLoading(false);
    }
  };

  /**
   * 즐겨찾기 콘텐츠 불러오기 (글로벌 즐겨찾기 순)
   */
  const fetchFavoriteContents = async () => {
    setIsFavoritesLoading(true);
    try {
      // 즐겨찾기 수가 많은 순으로 콘텐츠 조회 (글로벌 랭킹)
      const result = await firebaseService.content.getContentsByFavoriteCount(20);
      if (result.success) {
        const contents = (result.contents || []).sort((a, b) => (b.favoriteCount || 0) - (a.favoriteCount || 0));
        setFavoriteContents(contents);
      } else {
        console.error('즐겨찾기 순 콘텐츠 로드 실패:', result.error);
        setFavoriteContents([]);
      }
    } catch (error: any) {
      console.error('즐겨찾기 순 콘텐츠 로드 에러:', error);
      setFavoriteContents([]);
    } finally {
      setIsFavoritesLoading(false);
    }
  };

  /**
   * 카테고리 목록 불러오기
   */
  const fetchCategories = async () => {
    try {
      const result = await firebaseService.category.getAllCategories();
      if (result.success && result.categories) {
        const categoryNames = result.categories.map(cat => cat.name);
        setCategories(categoryNames);
      } else {
        // 카테고리가 없거나 오류가 발생한 경우 기본 카테고리 사용
        setCategories(['신입사원', '시설관리', '경영지원', '인사', '마케팅', '영업']);
      }
    } catch (error) {
      console.error('카테고리 로딩 에러:', error);
      // 오류 발생 시 기본 카테고리 사용
      setCategories(['신입사원', '시설관리', '경영지원', '인사', '마케팅', '영업']);
    }
  };

  /**
   * 카테고리별 콘텐츠 불러오기
   */
  const fetchContentsByCategory = async (category: string) => {
    setIsCategoryLoading(true);
    try {
      const result = await firebaseService.content.getContentsByCategory(category);
      if (result.success) {
        setCategoryContents(result.contents || []);
      } else {
        console.error('카테고리별 콘텐츠 로딩 실패:', result.error);
      }
    } catch (error) {
      console.error('카테고리별 콘텐츠 로딩 에러:', error);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  /**
   * 검색 취소/초기화
   */
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
  };

  /**
   * 콘텐츠 검색
   */
  const searchContents = async (query: string) => {
    if (!query.trim()) {
      // 검색어가 비어있으면 검색 취소
      clearSearch();
      return;
    }
    
    setIsSearching(true);
    setSearchQuery(query);
    
    try {
      const result = await firebaseService.content.searchContents(query);
      if (result.success) {
        setSearchResults(result.contents || []);
      } else {
        console.error('콘텐츠 검색 실패:', result.error);
      }
    } catch (error) {
      console.error('콘텐츠 검색 에러:', error);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * 새로고침 처리
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchLatestContents(),
        fetchPopularContents(),
        fetchRecommendedContents(),
        fetchFavoriteContents(),
        selectedCategory ? fetchContentsByCategory(selectedCategory) : Promise.resolve(),
      ]);
    } catch (error) {
      console.error('새로고침 에러:', error);
      Alert.alert('오류', '콘텐츠를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setRefreshing(false);
    }
  }, [selectedCategory]);

  /**
   * 카테고리 선택 처리
   */
  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    if (category) {
      fetchContentsByCategory(category);
    } else {
      setCategoryContents([]);
    }
  };

  /**
   * 콘텐츠 선택 시 플레이어 화면으로 이동
   */
  const handleContentPress = (contentId: string) => {
    navigation.navigate('PlayerScreen', { contentId });
  };

  /**
   * 정렬 방식 변경 핸들러
   */
  const handleSortModeChange = (mode: 'latest' | 'popular' | 'recommended' | 'favorites') => {
    setSortMode(mode);
    
    // 즐겨찾기 모드일 때만 즐겨찾기 콘텐츠 로드
    if (mode === 'favorites') {
      fetchFavoriteContents();
    }
  };

  /**
   * 전체보기 핸들러
   */
  const handleViewAll = (type: 'latest' | 'popular' | 'recommended') => {
    // 해당 타입의 모든 콘텐츠를 보여주는 화면으로 이동
    // 현재는 간단히 해당 정렬 모드로 변경
    setSortMode(type);
  };

  /**
   * 현재 정렬된 콘텐츠 가져오기
   */
  const getCurrentContents = () => {
    switch (sortMode) {
      case 'latest':
        return latestContents;
      case 'popular':
        return popularContents;
      case 'recommended':
        return recommendedContents;
      case 'favorites':
        return favoriteContents;
      default:
        return latestContents;
    }
  };

  /**
   * 현재 로딩 상태 가져오기
   */
  const getCurrentLoading = () => {
    switch (sortMode) {
      case 'latest':
        return isLatestLoading;
      case 'popular':
        return isPopularLoading;
      case 'recommended':
        return isRecommendedLoading;
      case 'favorites':
        return isFavoritesLoading;
      default:
        return isLatestLoading;
    }
  };

  // 초기 데이터 로딩
  useEffect(() => {
    fetchLatestContents();
    fetchPopularContents();
    fetchRecommendedContents();
    fetchFavoriteContents();
    fetchCategories();
  }, []);

  // 실시간 이벤트 구독
  useEffect(() => {
    const handleFavoriteChange = (data: any) => {
      console.log('홈 화면 즐겨찾기 변경 이벤트 수신:', data);
      
      // 즐겨찾기 순 모드일 때만 새로고침
      if (sortMode === 'favorites') {
        console.log('즐겨찾기 순 모드에서 목록 새로고침');
        fetchFavoriteContents();
      }
    };

    const handleLikeChange = (data: any) => {
      console.log('홈 화면 추천 변경 이벤트 수신:', data);
      
      // 추천순 모드일 때만 새로고침
      if (sortMode === 'recommended') {
        console.log('추천순 모드에서 목록 새로고침');
        fetchRecommendedContents();
      }
    };

    const handleViewCountChange = (data: any) => {
      console.log('홈 화면 조회수 변경 이벤트 수신:', data);
      
      // 인기순 모드일 때만 새로고침
      if (sortMode === 'popular') {
        console.log('인기순 모드에서 목록 새로고침');
        fetchPopularContents();
      }
    };

    // 이벤트 리스너 등록
    eventBus.on(EVENTS.FAVORITE_CHANGED, handleFavoriteChange);
    eventBus.on(EVENTS.LIKE_CHANGED, handleLikeChange);
    eventBus.on(EVENTS.VIEW_COUNT_CHANGED, handleViewCountChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      eventBus.off(EVENTS.FAVORITE_CHANGED, handleFavoriteChange);
      eventBus.off(EVENTS.LIKE_CHANGED, handleLikeChange);
      eventBus.off(EVENTS.VIEW_COUNT_CHANGED, handleViewCountChange);
    };
  }, [sortMode]);

  // 화면 포커스 시 즐겨찾기 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      if (sortMode === 'favorites') {
        fetchFavoriteContents();
      }
    }, [sortMode])
  );

  return (
    <View style={styles.container}>
      <SearchBar
        onSearch={searchContents}
        placeholder="콘텐츠 검색"
        style={styles.searchBar}
      />
      
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategorySelect}
        style={styles.categoryFilter}
      />
      
      {/* 정렬 버튼 */}
      <View style={styles.sortButtonsContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'latest' && styles.sortButtonActive]}
          onPress={() => handleSortModeChange('latest')}
        >
          <Text style={[styles.sortButtonText, sortMode === 'latest' && styles.sortButtonTextActive]}>
            최신순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortMode === 'popular' && styles.sortButtonActive]}
          onPress={() => handleSortModeChange('popular')}
        >
          <Text style={[styles.sortButtonText, sortMode === 'popular' && styles.sortButtonTextActive]}>
            인기순
          </Text>
        </TouchableOpacity>
        {user && (
          <TouchableOpacity
            style={[styles.sortButton, sortMode === 'recommended' && styles.sortButtonActive]}
            onPress={() => handleSortModeChange('recommended')}
          >
            <Text style={[styles.sortButtonText, sortMode === 'recommended' && styles.sortButtonTextActive]}>
              추천순
            </Text>
          </TouchableOpacity>
        )}
        {user && (
          <TouchableOpacity
            style={[styles.sortButton, sortMode === 'favorites' && styles.sortButtonActive]}
            onPress={() => handleSortModeChange('favorites')}
          >
            <Text style={[styles.sortButtonText, sortMode === 'favorites' && styles.sortButtonTextActive]}>
              즐겨찾기
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {searchQuery ? (
          // 검색 결과 표시
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>
              '{searchQuery}'에 대한 검색 결과
            </Text>
            {isSearching ? (
              <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
            ) : searchResults.length > 0 ? (
              <ContentSection
                title=""
                contents={searchResults}
                onContentPress={handleContentPress}
                horizontal={false}
              />
            ) : (
              <Text style={styles.noResultsText}>
                검색 결과가 없습니다.
              </Text>
            )}
          </View>
        ) : selectedCategory ? (
          // 선택된 카테고리의 콘텐츠 표시
          <View style={styles.categoryContentsContainer}>
            <Text style={styles.categoryTitle}>
              {selectedCategory} 관련 콘텐츠
            </Text>
            {isCategoryLoading ? (
              <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
            ) : categoryContents.length > 0 ? (
              <ContentSection
                title=""
                contents={categoryContents}
                onContentPress={handleContentPress}
                horizontal={false}
              />
            ) : (
              <Text style={styles.noResultsText}>
                해당 카테고리의 콘텐츠가 없습니다.
              </Text>
            )}
          </View>
        ) : (
          // 기본 홈 화면 - 선택된 정렬 방식의 콘텐츠 표시
          <View style={styles.mainContentContainer}>
          <Text style={styles.sectionTitle}>
            {sortMode === 'latest' && '최신 콘텐츠'}
            {sortMode === 'popular' && '인기 콘텐츠'}
            {sortMode === 'recommended' && '추천 콘텐츠'}
            {sortMode === 'favorites' && '즐겨찾기 순 콘텐츠'}
          </Text>
            {getCurrentLoading() ? (
              <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
            ) : getCurrentContents().length > 0 ? (
              <ContentSection
                title=""
                contents={getCurrentContents()}
                onContentPress={handleContentPress}
                horizontal={false}
              />
            ) : (
              <Text style={styles.noResultsText}>
                콘텐츠가 없습니다.
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    paddingBottom: 8,
  },
  categoryFilter: {
    marginBottom: 8,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sortButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  sortButtonTextActive: {
    color: '#ffffff',
  },
  mainContentContainer: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loader: {
    marginVertical: 20,
  },
  searchResultsContainer: {
    paddingTop: 16,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  categoryContentsContainer: {
    paddingTop: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
});

export default HomeScreen;