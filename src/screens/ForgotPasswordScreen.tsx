import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../state/AuthContext';

/**
 * 비밀번호 찾기 화면 컴포넌트
 * 
 * PRD F-01 명세에 따라 구현:
 * 1. 비밀번호 찾기 기능 제공
 */
const ForgotPasswordScreen: React.FC = () => {
  // 내비게이션 훅
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  
  // 인증 컨텍스트
  const { resetPassword, error, isLoading, clearError } = useAuth();
  
  // 상태 관리
  const [email, setEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  // 에러 메시지 표시
  useEffect(() => {
    if (error) {
      Alert.alert('비밀번호 재설정 오류', error);
      clearError();
    }
  }, [error, clearError]);

  /**
   * 비밀번호 재설정 이메일 전송
   */
  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await resetPassword(email);
      
      if (success) {
        setIsEmailSent(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 로그인 화면으로 이동
   */
  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>비밀번호 찾기</Text>
          
          {!isEmailSent ? (
            <>
              <Text style={styles.description}>
                가입하신 이메일 주소를 입력하시면 비밀번호 재설정 링크를 보내드립니다.
              </Text>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>이메일</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="가입하신 이메일을 입력하세요"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isSubmitting}
                />
              </View>

              <TouchableOpacity
                style={[styles.resetButton, isSubmitting && styles.disabledButton]}
                onPress={handleResetPassword}
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.resetButtonText}>비밀번호 재설정 이메일 전송</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>이메일이 전송되었습니다!</Text>
              <Text style={styles.successDescription}>
                {email} 주소로 비밀번호 재설정 링크가 전송되었습니다.
                이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정하세요.
              </Text>
              <Text style={styles.successNote}>
                이메일을 받지 못하셨나요? 스팸 폴더를 확인하거나 다시 시도해주세요.
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={handleGoToLogin}
          >
            <Text style={styles.backToLoginText}>로그인 화면으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#b3d7ff',
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    padding: 15,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#007bff',
    fontSize: 16,
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 15,
  },
  successDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  successNote: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
});

export default ForgotPasswordScreen;
