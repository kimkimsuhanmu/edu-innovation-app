import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Image } from 'react-native';

export default function App() {
  const handlePress = () => {
    Alert.alert(
      '김포도시관리공사 e-캠퍼스', 
      '온라인 학습 플랫폼에 오신 것을 환영합니다!\n\n• 다양한 교육 콘텐츠\n• 실시간 학습 진행률 추적\n• 모바일 최적화된 학습 환경\n\n지금 바로 학습을 시작해보세요!'
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>김포</Text>
        </View>
      </View>
      
      <Text style={styles.title}>김포도시관리공사</Text>
      <Text style={styles.subtitle}>e-캠퍼스</Text>
      <Text style={styles.description}>온라인 학습 플랫폼</Text>
      
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.buttonText}>학습 시작하기</Text>
      </TouchableOpacity>
      
      <View style={styles.features}>
        <Text style={styles.featureText}>✓ 모바일 최적화</Text>
        <Text style={styles.featureText}>✓ 실시간 진행률</Text>
        <Text style={styles.featureText}>✓ 다양한 콘텐츠</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
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
});
