import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Content } from '../services/firebase';
import eventBus, { EVENTS } from '../utils/EventBus';

/**
 * ContentCard 컴포넌트 props 타입 정의
 */
interface ContentCardProps {
  content: Content;
  onPress: (contentId: string) => void;
  style?: object;
}

/**
 * 콘텐츠 카드 컴포넌트
 * 
 * 교육 콘텐츠 정보를 카드 형태로 표시합니다.
 * 썸네일, 제목, 카테고리, 재생 시간을 보여줍니다.
 * 실시간으로 조회수, 추천수, 즐겨찾기 수가 업데이트됩니다.
 */
const ContentCard: React.FC<ContentCardProps> = ({ content, onPress, style }) => {
  // 실시간 업데이트를 위한 상태
  const [viewCount, setViewCount] = useState(content.viewCount || 0);
  const [likeCount, setLikeCount] = useState(content.likeCount || 0);
  const [favoriteCount, setFavoriteCount] = useState(content.favoriteCount || 0);

  // 이벤트 구독으로 실시간 업데이트
  useEffect(() => {
    const handleLikeChange = (data: any) => {
      if (data.contentId === content.id) {
        setLikeCount(data.likeCount);
        console.log(`ContentCard ${content.id} 추천수 업데이트:`, data.likeCount);
      }
    };

    const handleViewCountChange = (data: any) => {
      if (data.contentId === content.id) {
        setViewCount(data.viewCount);
        console.log(`ContentCard ${content.id} 조회수 업데이트:`, data.viewCount);
      }
    };

    const handleFavoriteChange = (data: any) => {
      if (data.contentId === content.id) {
        // 즐겨찾기 수 실시간 업데이트
        setFavoriteCount(prev => data.isFavorite ? prev + 1 : prev - 1);
        console.log(`ContentCard ${content.id} 즐겨찾기 수 업데이트:`, data.isFavorite ? favoriteCount + 1 : favoriteCount - 1);
      }
    };

    // 이벤트 리스너 등록
    eventBus.on(EVENTS.LIKE_CHANGED, handleLikeChange);
    eventBus.on(EVENTS.VIEW_COUNT_CHANGED, handleViewCountChange);
    eventBus.on(EVENTS.FAVORITE_CHANGED, handleFavoriteChange);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      eventBus.off(EVENTS.LIKE_CHANGED, handleLikeChange);
      eventBus.off(EVENTS.VIEW_COUNT_CHANGED, handleViewCountChange);
      eventBus.off(EVENTS.FAVORITE_CHANGED, handleFavoriteChange);
    };
  }, [content.id]);

  /**
   * 재생 시간을 포맷팅하는 함수 (초 -> 분:초)
   */
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={() => onPress(content.id)}
      activeOpacity={0.7}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ 
            uri: content.thumbnailUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg=='
          }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(content.duration)}</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {content.title}
        </Text>
        
        {/* 메타 정보 */}
        <View style={styles.metaContainer}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{content.category}</Text>
          </View>
        </View>
        
        {/* 통계 정보 */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={12} color="#666" />
            <Text style={styles.statText}>{viewCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart-outline" size={12} color="#666" />
            <Text style={styles.statText}>{likeCount}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="bookmark-outline" size={12} color="#666" />
            <Text style={styles.statText}>{favoriteCount}</Text>
          </View>
        </View>
        
        {/* 업로드 일자 */}
        <Text style={styles.uploadDate}>
          {content.createdAt ? new Date(content.createdAt.seconds * 1000).toLocaleDateString('ko-KR') : '날짜 정보 없음'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = width / 2 - 24; // 2열 그리드, 양쪽 패딩 고려

const styles = StyleSheet.create({
  container: {
    width: cardWidth,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 2, // Android용 그림자
    marginBottom: 16,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
    height: 40, // 2줄 고정 높이
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#666',
  },
  uploadDate: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#e6f2ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    color: '#007bff',
    fontSize: 12,
    fontWeight: '500',
  },
  viewCount: {
    fontSize: 12,
    color: '#666',
  },
});

export default ContentCard;
