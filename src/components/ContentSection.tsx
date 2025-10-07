import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity
} from 'react-native';
import ContentCard from './ContentCard';
import { Content } from '../services/firebase';

/**
 * ContentSection 컴포넌트 props 타입 정의
 */
interface ContentSectionProps {
  title: string;
  contents: Content[];
  onContentPress: (contentId: string) => void;
  onViewAllPress?: () => void;
  isLoading?: boolean;
  horizontal?: boolean;
}

/**
 * 콘텐츠 섹션 컴포넌트
 * 
 * 제목과 콘텐츠 목록을 포함하는 섹션을 표시합니다.
 * 수평 또는 수직 스크롤 목록으로 표시할 수 있습니다.
 */
const ContentSection: React.FC<ContentSectionProps> = ({
  title,
  contents,
  onContentPress,
  onViewAllPress,
  isLoading = false,
  horizontal = true
}) => {
  /**
   * 로딩 중일 때 표시할 스켈레톤 UI
   */
  const renderSkeletonItems = () => {
    return Array(5).fill(0).map((_, index) => (
      <View key={`skeleton-${index}`} style={[
        styles.skeletonCard,
        horizontal ? styles.horizontalCard : styles.gridCard
      ]} />
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>{title}</Text>
        {onViewAllPress && (
          <TouchableOpacity onPress={onViewAllPress}>
            <Text style={styles.viewAllText}>전체보기</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={[styles.contentContainer, horizontal && styles.horizontalContainer]}>
          {renderSkeletonItems()}
        </View>
      ) : contents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>콘텐츠가 없습니다.</Text>
        </View>
      ) : horizontal ? (
        <FlatList
          data={contents.filter(content => content && content.id)}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <ContentCard
              content={item}
              onPress={onContentPress}
              style={styles.horizontalCard}
            />
          )}
          contentContainerStyle={styles.horizontalList}
        />
      ) : (
        <View style={styles.gridContainer}>
          {contents.filter(content => content && content.id).map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onPress={onContentPress}
              style={styles.gridCard}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#007bff',
  },
  contentContainer: {
    flexDirection: 'row',
  },
  horizontalContainer: {
    paddingLeft: 16,
  },
  horizontalList: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  horizontalCard: {
    width: 200,
    marginRight: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gridCard: {
    marginBottom: 16,
    width: '48%',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  skeletonCard: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    height: 180,
  },
});

export default ContentSection;
