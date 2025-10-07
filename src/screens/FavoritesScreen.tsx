import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../state/AuthContext';
import { favoriteService, Content } from '../services/firebase';

/**
 * 즐겨찾기 화면 컴포넌트
 * 
 * 사용자가 즐겨찾기로 추가한 콘텐츠 목록을 표시합니다.
 */
const FavoritesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<(Content & { favoriteId: string })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  /**
   * 즐겨찾기 목록 로드
   */
  const loadFavorites = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const result = await favoriteService.getUserFavorites(user.uid);
      
      if (result.success && result.favorites) {
        // 타입 변환
        const favoriteContents = result.favorites.map((fav: any) => ({
          ...fav.content,
          favoriteId: fav.id
        }));
        setFavorites(favoriteContents);
      } else {
        console.error('즐겨찾기 로드 실패:', result.error);
      }
    } catch (error: any) {
      console.error('즐겨찾기 로드 에러:', error);
      Alert.alert('오류', '즐겨찾기 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 새로고침 핸들러
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFavorites();
    setIsRefreshing(false);
  };

  /**
   * 콘텐츠 클릭 핸들러
   */
  const handleContentPress = (content: Content) => {
    console.log('FavoritesScreen: 콘텐츠 클릭, PlayerScreen으로 네비게이션:', content.id);
    navigation.navigate('PlayerScreen', { contentId: content.id });
  };

  /**
   * 즐겨찾기 제거 핸들러
   */
  const handleRemoveFavorite = async (contentId: string, favoriteId: string) => {
    if (!user) return;
    
    Alert.alert(
      '즐겨찾기 제거',
      '이 콘텐츠를 즐겨찾기에서 제거하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '제거',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await favoriteService.toggleFavorite(user.uid, contentId);
              
              if (result.success) {
                // 로컬 상태에서 제거
                setFavorites(prev => prev.filter(fav => fav.id !== contentId));
                Alert.alert('완료', '즐겨찾기에서 제거되었습니다.');
              } else {
                Alert.alert('오류', result.error || '즐겨찾기 제거에 실패했습니다.');
              }
            } catch (error: any) {
              console.error('즐겨찾기 제거 에러:', error);
              Alert.alert('오류', '즐겨찾기 제거 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  /**
   * 콘텐츠 아이템 렌더링
   */
  const renderContentItem = ({ item }: { item: Content & { favoriteId: string } }) => (
    <TouchableOpacity
      style={styles.contentItem}
      onPress={() => handleContentPress(item)}
    >
      <Image
        source={{ uri: item.thumbnailUrl }}
        style={styles.thumbnail}
        resizeMode="cover"
      />
      
      <View style={styles.contentInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.metaInfo}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.metaText}>
              {Math.floor(item.duration / 60)}:{(item.duration % 60).toString().padStart(2, '0')}
            </Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{item.viewCount || 0}회</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Ionicons name="folder-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{item.category}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id, item.favoriteId)}
      >
        <Ionicons name="bookmark" size={20} color="#ff6b6b" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  /**
   * 빈 상태 렌더링
   */
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>즐겨찾기가 없습니다</Text>
      <Text style={styles.emptyDescription}>
        관심 있는 콘텐츠를 즐겨찾기에 추가해보세요
      </Text>
    </View>
  );

  // 초기 로딩
  useEffect(() => {
    loadFavorites();
  }, [user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>즐겨찾기를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>즐겨찾기</Text>
        <Text style={styles.headerSubtitle}>
          {favorites.length}개의 콘텐츠
        </Text>
      </View>
      
      <FlatList
        data={favorites}
        renderItem={renderContentItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={favorites.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  contentItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  contentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666666',
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default FavoritesScreen;
