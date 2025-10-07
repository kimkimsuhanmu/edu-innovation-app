import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import firebaseService, { Content, curationService } from '../services/firebase';
import ContentCard from '../components/ContentCard';

// 라우트 파라미터 타입 정의
type CurationDetailRouteProp = RouteProp<RootStackParamList, 'CurationDetail'>;

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
 * 큐레이션 상세 화면 컴포넌트
 * 특정 큐레이션에 포함된 콘텐츠들을 순서대로 표시하고 학습할 수 있습니다.
 */
const CurationDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CurationDetailRouteProp>();
  const { curationId } = route.params;

  const [curation, setCuration] = useState<Curation | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  /**
   * 큐레이션 정보 및 콘텐츠 로드
   */
  const loadCurationData = async () => {
    try {
      setLoading(true);
      
      // 큐레이션 정보 로드
      const curationResult = await curationService.getCurations();
      if (curationResult.success && curationResult.curations) {
        const foundCuration = curationResult.curations.find(c => c.id === curationId);
        if (foundCuration) {
          setCuration(foundCuration);
          
          // 큐레이션의 콘텐츠 로드
          const contentsResult = await curationService.getCurationContents(curationId);
          if (contentsResult.success && contentsResult.contents) {
            setContents(contentsResult.contents);
          } else {
            console.error('콘텐츠 로드 실패:', contentsResult.error);
            Alert.alert('오류', '콘텐츠를 불러오는데 실패했습니다.');
          }
        } else {
          Alert.alert('오류', '큐레이션을 찾을 수 없습니다.');
          navigation.goBack();
        }
      } else {
        console.error('큐레이션 로드 실패:', curationResult.error);
        Alert.alert('오류', '큐레이션을 불러오는데 실패했습니다.');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('큐레이션 데이터 로드 에러:', error);
      Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  /**
   * 새로고침
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCurationData();
    setRefreshing(false);
  };

  /**
   * 콘텐츠 선택 핸들러
   */
  const handleContentPress = (contentId: string) => {
    navigation.navigate('PlayerScreen', { contentId });
  };

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadCurationData();
  }, [curationId]);

  /**
   * 콘텐츠 렌더링
   */
  const renderContent = ({ item, index }: { item: Content; index: number }) => (
    <View style={styles.contentItem}>
      <View style={styles.contentOrder}>
        <Text style={styles.orderNumber}>{index + 1}</Text>
      </View>
      <View style={styles.contentCard}>
        <ContentCard
          content={item}
          onPress={() => handleContentPress(item.id)}
        />
      </View>
    </View>
  );

  /**
   * 헤더 렌더링
   */
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>{curation?.title}</Text>
        <Text style={styles.description}>{curation?.description}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="play-circle-outline" size={16} color="#007bff" />
            <Text style={styles.statText}>
              {contents.length}개 콘텐츠
            </Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              총 {Math.round(contents.reduce((total, content) => total + (content.duration || 0), 0) / 60)}분
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>큐레이션을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={contents}
        renderItem={renderContent}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="play-circle-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              이 큐레이션에는 콘텐츠가 없습니다.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  contentItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
  },
  contentOrder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 8,
  },
  orderNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  contentCard: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default CurationDetailScreen;

