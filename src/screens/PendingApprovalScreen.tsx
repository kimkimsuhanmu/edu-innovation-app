import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';

type PendingApprovalScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'PendingApproval'>;

/**
 * 승인 대기 화면 컴포넌트
 * 
 * 회원가입 후 관리자 승인을 기다리는 화면
 */
const PendingApprovalScreen: React.FC = () => {
  const navigation = useNavigation<PendingApprovalScreenNavigationProp>();

  /**
   * 로그인 화면으로 이동
   */
  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        {/* 아이콘 */}
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>⏳</Text>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>승인 대기 중</Text>
        
        {/* 설명 */}
        <Text style={styles.description}>
          회원가입이 완료되었습니다.{'\n'}
          관리자 승인 후 로그인이 가능합니다.
        </Text>

        {/* 추가 안내 */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>다음 단계:</Text>
          <Text style={styles.infoText}>• 관리자가 회원가입을 검토합니다</Text>
          <Text style={styles.infoText}>• 승인 완료 시 이메일로 알림을 받습니다</Text>
          <Text style={styles.infoText}>• 승인 후 로그인하여 서비스를 이용하세요</Text>
        </View>

        {/* 로그인 화면으로 이동 버튼 */}
        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleGoToLogin}
        >
          <Text style={styles.loginButtonText}>로그인 화면으로</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff3cd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    borderWidth: 2,
    borderColor: '#ffeaa7',
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    width: '100%',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PendingApprovalScreen;
