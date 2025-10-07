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
  Alert,
  Switch
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../state/AuthContext';

/**
 * 로그인 화면 컴포넌트
 * 
 * PRD F-01 명세에 따라 구현:
 * 1. ID(사번)와 비밀번호 입력 필드
 * 2. '로그인 유지' 옵션
 * 3. 비밀번호 찾기 기능
 * 4. 회원가입 링크
 */
const LoginScreen: React.FC = () => {
  // 내비게이션 훅
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  
  // 인증 컨텍스트
  const { login, error, isLoading, clearError } = useAuth();
  
  // 상태 관리
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 에러 메시지 표시
  useEffect(() => {
    if (error) {
      Alert.alert('로그인 오류', error);
      clearError();
    }
  }, [error, clearError]);

  /**
   * 로그인 처리
   */
  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    if (!password) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await login(email, password, rememberMe);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 회원가입 화면으로 이동
   */
  const handleRegister = () => {
    navigation.navigate('Register');
  };

  /**
   * 비밀번호 찾기 화면으로 이동
   */
  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>김포도시관리공사 e-캠퍼스</Text>
          <Text style={styles.subtitle}>로그인</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력하세요"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.optionsContainer}>
            <View style={styles.rememberMeContainer}>
              <Switch
                value={rememberMe}
                onValueChange={setRememberMe}
                disabled={isSubmitting}
              />
              <Text style={styles.rememberMeText}>로그인 유지</Text>
            </View>

            <TouchableOpacity
              onPress={handleForgotPassword}
              disabled={isSubmitting}
            >
              <Text style={styles.forgotPasswordText}>비밀번호 찾기</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isSubmitting && styles.disabledButton]}
            onPress={handleLogin}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>로그인</Text>
            )}
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>계정이 없으신가요?</Text>
            <TouchableOpacity onPress={handleRegister} disabled={isSubmitting}>
              <Text style={styles.registerLink}>회원가입</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
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
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#007bff',
  },
  loginButton: {
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#b3d7ff',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default LoginScreen;
