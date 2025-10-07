import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import firebaseService from '../services/firebase';
import LearningRecordCard from './LearningRecordCard';

/**
 * CompletedList 컴포넌트 props 타입 정의
 */
interface CompletedListProps {
  userId: string;
}

/**
 * 수료한 과정 목록 컴포넌트
 * 
 * 사용자가 수료한 과정 목록을 표시합니다.
 */
const CompletedList: React.FC<CompletedListProps> = ({ userId }) => {
  // 상태 관리
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 수료한 과정 목록 로드
  useEffect(() => {
    loadCompletedContents();
  }, [userId]);

  /**
   * 수료한 과정 목록 로드
   */
  const loadCompletedContents = async () => {
    if (isRefreshing) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await firebaseService.learning.getCompletedContents(userId);
      
      if (result.success) {
        setRecords(result.records || []);
      } else {
        setError(result.error || '수료한 과정을 불러오는데 실패했습니다.');
      }
    } catch (err: any) {
      console.error('수료한 과정 로드 에러:', err);
      setError(err.message || '수료한 과정을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  /**
   * 새로고침 처리
   */
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadCompletedContents();
  };

  /**
   * 목록 렌더링
   */
  const renderItem = ({ item }: { item: any }) => {
    return (
      <LearningRecordCard
        id={item.id}
        contentId={item.contentId}
        title={item.title}
        thumbnailUrl={item.thumbnailUrl}
        progress={item.progress}
        completed={item.completed}
        date={item.completionDate?.toDate?.() 
          ? item.completionDate.toDate().toISOString() 
          : new Date().toISOString()}
        isCompletedCard={true}
      />
    );
  };

  // 로딩 중 표시
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>수료한 과정을 불러오는 중...</Text>
      </View>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // 데이터 없음 표시
  if (records.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>수료한 과정이 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={records}
      renderItem={renderItem}
      keyExtractor={(item) => item.id || item.contentId}
      contentContainerStyle={styles.listContainer}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={['#007bff']}
          tintColor="#007bff"
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d9534f',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CompletedList;
