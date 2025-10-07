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
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../state/AuthContext';
import { showAlert } from '../utils/AlertUtils';

/**
 * 회원가입 화면 컴포넌트
 * 
 * PRD F-01 명세에 따라 구현:
 * 1. 최초 사용자는 사번, 이름 등 내부 인증을 통해 회원가입
 */
const RegisterScreen: React.FC = () => {
  // 내비게이션 훅
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  
  // 인증 컨텍스트
  const { register, error, isLoading, clearError } = useAuth();
  
  // 상태 관리
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 에러 메시지 표시
  useEffect(() => {
    if (error) {
      Alert.alert('회원가입 오류', error);
      clearError();
    }
  }, [error, clearError]);

  /**
   * 회원가입 처리
   */
  const handleRegister = async () => {
    // 입력값 검증
    if (!email.trim()) {
      showAlert('알림', '이메일을 입력해주세요.');
      return;
    }

    if (!password) {
      showAlert('알림', '비밀번호를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!employeeId.trim()) {
      showAlert('알림', '사번을 입력해주세요.');
      return;
    }

    if (!name.trim()) {
      showAlert('알림', '이름을 입력해주세요.');
      return;
    }

    // 비밀번호 강도 검증 (최소 6자 이상)
    if (password.length < 6) {
      showAlert('알림', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await register(email, password, employeeId, name);
      
      if (success) {
        showAlert(
          '회원가입 완료', 
          '회원가입이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다.', 
          [{ text: '확인', onPress: () => navigation.navigate('PendingApproval') }]
        );
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
          <Text style={styles.title}>김포도시관리공사 e-캠퍼스</Text>
          <Text style={styles.subtitle}>회원가입</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="회사 이메일을 입력하세요"
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
              placeholder="비밀번호를 입력하세요 (6자 이상)"
              secureTextEntry
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 확인</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="비밀번호를 다시 입력하세요"
              secureTextEntry
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>사번</Text>
            <TextInput
              style={styles.input}
              value={employeeId}
              onChangeText={setEmployeeId}
              placeholder="사번을 입력하세요"
              keyboardType="default"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              editable={!isSubmitting}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, isSubmitting && styles.disabledButton]}
            onPress={handleRegister}
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting || isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.registerButtonText}>회원가입</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
            <TouchableOpacity onPress={handleGoToLogin} disabled={isSubmitting}>
              <Text style={styles.loginLink}>로그인</Text>
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
  registerButton: {
    backgroundColor: '#28a745',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#8ed7a1',
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
    marginLeft: 5,
  },
});

export default RegisterScreen;
