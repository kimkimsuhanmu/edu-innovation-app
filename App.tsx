import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  StatusBar,
  Platform 
} from 'react-native';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 앱 초기화 시뮬레이션
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleStartLearning = () => {
    Alert.alert(
      '김포도시관리공사 e-캠퍼스',
      '온라인 학습 플랫폼에 오신 것을 환영합니다!\n\n• 다양한 교육 콘텐츠\n• 실시간 학습 진행률 추적\n• 모바일 최적화된 학습 환경\n\n지금 바로 학습을 시작해보세요!'
    );
  };

  const handleMenuPress = () => {
    Alert.alert('메뉴', '메뉴 기능이 곧 추가될 예정입니다.');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>김포</Text>
        </View>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={handleMenuPress}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>김포도시관리공사 e-캠퍼스</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 메인 콘텐츠 */}
        <View style={styles.mainContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>김포</Text>
            </View>
          </View>
          
          <Text style={styles.title}>김포도시관리공사</Text>
          <Text style={styles.subtitle}>e-캠퍼스</Text>
          <Text style={styles.description}>온라인 학습 플랫폼</Text>
          
          <TouchableOpacity style={styles.button} onPress={handleStartLearning}>
            <Text style={styles.buttonIcon}>▶</Text>
            <Text style={styles.buttonText}>학습 시작하기</Text>
          </TouchableOpacity>
          
          <View style={styles.features}>
            <Text style={styles.featureText}>✓ 모바일 최적화</Text>
            <Text style={styles.featureText}>✓ 실시간 진행률</Text>
            <Text style={styles.featureText}>✓ 다양한 콘텐츠</Text>
          </View>
        </View>

        {/* 추가 기능 섹션 */}
        <View style={styles.additionalFeatures}>
          <Text style={styles.sectionTitle}>주요 기능</Text>
          
          <View style={styles.featureGrid}>
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>📹</Text>
              <Text style={styles.featureCardText}>동영상 학습</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>🎧</Text>
              <Text style={styles.featureCardText}>오디오 학습</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureCardText}>진행률 추적</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.featureCard}>
              <Text style={styles.featureIcon}>⭐</Text>
              <Text style={styles.featureCardText}>즐겨찾기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    fontSize: 20,
    color: '#2c3e50',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerSpacer: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3498db',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#3498db',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#3498db',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 30,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  features: {
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#27ae60',
    marginBottom: 8,
    fontWeight: '500',
  },
  additionalFeatures: {
    padding: 20,
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featureCardText: {
    fontSize: 14,
    color: '#2c3e50',
    marginTop: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  buttonIcon: {
    marginRight: 8,
    fontSize: 18,
    color: 'white',
  },
});