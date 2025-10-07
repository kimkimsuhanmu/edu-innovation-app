import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';

/**
 * LearningRecordCard 컴포넌트 props 타입 정의
 */
interface LearningRecordCardProps {
  id: string;
  contentId: string;
  title: string;
  thumbnailUrl: string;
  progress: number;
  completed: boolean;
  date: string; // 수료일 또는 최근 학습일
  isCompletedCard?: boolean; // 수료한 과정 카드인지 여부
}

/**
 * 학습 기록 카드 컴포넌트
 * 
 * 학습 중인 과정 또는 수료한 과정을 카드 형태로 표시합니다.
 */
const LearningRecordCard: React.FC<LearningRecordCardProps> = ({
  id,
  contentId,
  title,
  thumbnailUrl,
  progress,
  completed,
  date,
  isCompletedCard = false
}) => {
  // 내비게이션 훅
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  /**
   * 플레이어 화면으로 이동
   */
  const handlePress = () => {
    navigation.navigate('PlayerScreen', { contentId });
  };

  /**
   * 날짜 포맷팅
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* 썸네일 */}
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: thumbnailUrl || 'https://via.placeholder.com/300x200' }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        
        {/* 완료 배지 */}
        {completed && (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
            <Text style={styles.completedText}>수료</Text>
          </View>
        )}
      </View>

      {/* 정보 */}
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
          {title}
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar,
                { width: `${progress}%` },
                completed && styles.completedProgressBar
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>
        
        <View style={styles.dateContainer}>
          <Ionicons 
            name={isCompletedCard ? "trophy-outline" : "time-outline"} 
            size={14} 
            color="#666" 
          />
          <Text style={styles.dateText}>
            {isCompletedCard ? '수료일: ' : '최근 학습: '}
            {formatDate(date)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: 120,
  },
  completedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4caf50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    height: 40, // 2줄 고정 높이
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 3,
  },
  completedProgressBar: {
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    width: 36,
    textAlign: 'right',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default LearningRecordCard;
