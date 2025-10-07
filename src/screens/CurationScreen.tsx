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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import firebaseService, { curationService } from '../services/firebase';
import ContentCard from '../components/ContentCard';

// 큐레이션 타입 정의
interface Curation {
  id: string;
  title: string;
  description: string;
  contentIds: string[];
  createdAt: any;
  updatedAt: any;
}

/**
 * 큐레이션 화면 컴포넌트
 * 관리자가 생성한 큐레이션 목록을 표시하고, 각 큐레이션의 콘텐츠를 탐색할 수 있습니다.
 */
const CurationScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [curations, setCurations] = useState<Curation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /**
   * 큐레이션 목록 로드
   */
  const loadCurations = async () => {
    try {
      setLoading(true);
      const result = await curationService.getCurations();
      if (result.success && result.curations) {
        setCurations(result.curations);
      } else {
        console.error('큐레이션 로드 실패:', result.error);
      }
    } catch (error: any) {
      console.error('큐레이션 로드 에러:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 새로고침
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCurations();
    setRefreshing(false);
  };

  /**
   * 큐레이션 선택 핸들러
   */
  const handleCurationPress = (curation: Curation) => {
    navigation.navigate('CurationDetail', { curationId: curation.id });
  };

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadCurations();
  }, []);

  /**
   * 큐레이션 렌더링
   */
  const renderCuration = ({ item }: { item: Curation }) => (
    <TouchableOpacity
      style={styles.curationCard}
      onPress={() => handleCurationPress(item)}
    >
      <View style={styles.curationHeader}>
        <Text style={styles.curationTitle}>{item.title}</Text>
        <Ionicons name="chevron-forward" size={20} color="#666" />
      </View>
      
      <Text style={styles.curationDescription} numberOfLines={2}>
        {item.description}
      </Text>
      
      <View style={styles.curationFooter}>
        <View style={styles.curationStats}>
          <Ionicons name="play-circle-outline" size={16} color="#007bff" />
          <Text style={styles.curationStatsText}>
            {item.contentIds.length}개 콘텐츠
          </Text>
        </View>
        <Text style={styles.curationDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.title}>큐레이션</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* 큐레이션 목록 */}
      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>큐레이션을 불러오는 중...</Text>
          </View>
        ) : curations.length > 0 ? (
          <FlatList
            data={curations}
            renderItem={renderCuration}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            contentContainerStyle={styles.curationList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="library-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              아직 생성된 큐레이션이 없습니다.
            </Text>
            <Text style={styles.emptySubText}>
              관리자가 큐레이션을 생성하면 여기에 표시됩니다.
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  curationList: {
    paddingVertical: 16,
  },
  curationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  curationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  curationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  curationDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  curationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  curationStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  curationStatsText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 4,
    fontWeight: '500',
  },
  curationDate: {
    fontSize: 12,
    color: '#999',
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
    fontWeight: '500',
  },
  emptySubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default CurationScreen;
