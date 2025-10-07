import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import firebaseService, { favoriteService } from '../services/firebase';
import ContentCard from './ContentCard';
import eventBus, { EVENTS } from '../utils/EventBus';

type FavoritesListProps = {
  userId: string;
};

const FavoritesList: React.FC<FavoritesListProps> = ({ userId }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /**
   * 즐겨찾기 목록 불러오기
   */
  const loadFavorites = async () => {
    try {
      console.log('FavoritesList: getUserFavorites 호출 시작:', userId);
      const result = await favoriteService.getUserFavorites(userId);
      
      if (result.success && result.favorites) {
        // getUserFavorites는 { content: Content } 형태로 반환
        const favoriteContents = result.favorites.map((item: any) => item.content);
        setFavorites(favoriteContents);
      } else {
        console.error('즐겨찾기 목록 가져오기 에러:', result.error);
        setFavorites([]);
      }
    } catch (error) {
      console.error('즐겨찾기 목록 로딩 에러:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 새로고침 처리
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  };

  /**
   * 콘텐츠 클릭 핸들러
   */
  const handleContentPress = (contentId: string) => {
    console.log('FavoritesList: 콘텐츠 클릭, PlayerScreen으로 네비게이션:', contentId);
    navigation.navigate('PlayerScreen', { contentId });
  };

  useEffect(() => {
    if (userId) {
      console.log('FavoritesList: userId 설정됨, 즐겨찾기 목록 로드:', userId);
      loadFavorites();
    }
  }, [userId]);

  // 즐겨찾기 변경 이벤트 구독
  useEffect(() => {
    if (!userId) {
      console.log('FavoritesList: userId가 없어서 이벤트 리스너 등록 건너뜀');
      return;
    }

    console.log('FavoritesList: 즐겨찾기 변경 이벤트 리스너 등록:', userId);
    
    const handleFavoriteChange = (data: any) => {
      console.log('=== FavoritesList: 즐겨찾기 변경 이벤트 수신 ===');
      console.log('이벤트 데이터:', data);
      console.log('현재 사용자 ID:', userId);
      console.log('수신된 사용자 ID:', data.userId);
      console.log('사용자 ID 매칭:', data.userId === userId);
      
      if (data.userId === userId) {
        if (data.isFavorite) {
          // 즐겨찾기 추가 - 해당 콘텐츠를 목록에 추가
          console.log('FavoritesList: 즐겨찾기 추가됨, 목록 새로고침');
          loadFavorites();
        } else {
          // 즐겨찾기 제거 - 해당 콘텐츠를 목록에서 제거
          console.log('FavoritesList: 즐겨찾기 제거됨, 목록에서 제거');
          setFavorites(prev => prev.filter(item => item.id !== data.contentId));
        }
      } else {
        console.log('FavoritesList: 다른 사용자의 즐겨찾기 변경, 무시');
      }
    };

    // 이벤트 리스너 등록
    eventBus.on(EVENTS.FAVORITE_CHANGED, handleFavoriteChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      console.log('FavoritesList: 이벤트 리스너 제거');
      eventBus.off(EVENTS.FAVORITE_CHANGED, handleFavoriteChange);
    };
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>즐겨찾기 목록을 불러오는 중...</Text>
      </View>
    );
  }

  if (favorites.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>즐겨찾기한 콘텐츠가 없습니다</Text>
        <Text style={styles.emptySubtitle}>
          마음에 드는 콘텐츠를 즐겨찾기에 추가해보세요
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ContentCard
            content={item}
            onPress={handleContentPress}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007bff']}
            tintColor="#007bff"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
});

export default FavoritesList;