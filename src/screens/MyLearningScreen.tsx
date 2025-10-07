import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAuth } from '../state/AuthContext';
import firebaseService from '../services/firebase';
import InProgressList from '../components/InProgressList';
import CompletedList from '../components/CompletedList';
import FavoritesList from '../components/FavoritesList';

// 탭 내비게이션 타입 정의
type LearningTabParamList = {
  InProgress: undefined;
  Completed: undefined;
  Favorites: undefined;
};

// 탭 내비게이터 생성
const Tab = createMaterialTopTabNavigator<LearningTabParamList>();

/**
 * 나의 학습 기록 화면 컴포넌트
 * 
 * PRD F-05 명세에 따라 구현:
 * 1. '학습 중인 과정'과 '수료한 과정' 탭으로 구분
 * 2. 각 목록에는 콘텐츠 제목, 수료일(또는 최근 학습일), 진도율 표시
 * 3. 목록의 항목을 클릭하면 해당 콘텐츠 플레이어로 이동
 */
const MyLearningScreen: React.FC = () => {
  // 인증 컨텍스트
  const { user } = useAuth();
  
  // 사용자 ID - user가 있을 때만 설정
  const [userId, setUserId] = useState<string>(user?.uid || '');
  
  // 사용자 정보 설정 및 마이그레이션 실행
  useEffect(() => {
    if (user) {
      setUserId(user.uid);
      
      // 기존 학습 기록 마이그레이션 실행
      const runMigration = async () => {
        try {
          console.log('MyLearningScreen: 마이그레이션 시작');
          const result = await firebaseService.learning.migrateLearningRecords(user.uid);
          if (result.success) {
            console.log('MyLearningScreen: 마이그레이션 완료,', result.migratedCount, '개 기록 업데이트');
            
            // 테스트 기록 정리 (개발/디버깅용)
            // 실제 사용에서는 주석 처리
            /*
            console.log('MyLearningScreen: 테스트 기록 정리 시도');
            const deleteResult = await firebaseService.learning.deleteTestLearningRecords(user.uid);
            if (deleteResult.success) {
              console.log('MyLearningScreen: 테스트 기록 정리 완료,', deleteResult.deletedCount, '개 삭제');
            } else {
              console.error('MyLearningScreen: 테스트 기록 정리 실패:', deleteResult.error);
            }
            */
          } else {
            console.error('MyLearningScreen: 마이그레이션 실패:', result.error);
          }
        } catch (error) {
          console.error('MyLearningScreen: 마이그레이션 에러:', error);
        }
      };
      
      runMigration();
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>나의 학습 기록</Text>
      </View>
      
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007bff',
          tabBarInactiveTintColor: '#666',
          tabBarIndicatorStyle: {
            backgroundColor: '#007bff',
          },
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarStyle: {
            backgroundColor: '#fff',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#e0e0e0',
          },
        }}
      >
        <Tab.Screen
          name="InProgress"
          options={{ title: '학습 중인 과정' }}
          children={() => <InProgressList userId={userId} />}
        />
        
        <Tab.Screen
          name="Completed"
          options={{ title: '수료한 과정' }}
          children={() => <CompletedList userId={userId} />}
        />
        
        <Tab.Screen
          name="Favorites"
          options={{ title: '즐겨찾기' }}
          children={() => <FavoritesList userId={userId} />}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default MyLearningScreen;