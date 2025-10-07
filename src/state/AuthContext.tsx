import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseService, { UserProfile } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * 인증 컨텍스트에서 제공하는 값들의 타입 정의
 */
interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  login: (emailOrEmployeeId: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  register: (email: string, password: string, employeeId: string, name: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * 인증 컨텍스트 생성
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 인증 상태 관리를 위한 Provider 컴포넌트
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 앱 시작 시 로그인 상태 확인
   * AsyncStorage에 저장된 사용자 정보가 있으면 자동 로그인
   */
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        // AsyncStorage에서 사용자 정보 가져오기
        const userJson = await AsyncStorage.getItem('@auth_user');
        
        if (userJson) {
          const userData = JSON.parse(userJson);
          setUser(userData);
        }
      } catch (err) {
        console.error('자동 로그인 에러:', err);
      } finally {
        setIsLoading(false);
      }
    };

    // Firebase 인증 상태 변경 리스너 등록
    const unsubscribe = firebaseService.auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase 사용자가 있으면 Firestore에서 추가 정보 가져오기
        try {
          const userDoc = await getDoc(doc(firebaseService.firestore, 'user', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // 계정 상태 확인
            if (userData.status === 'pending') {
              // 승인 대기 중인 계정은 로그인 불가
              setUser(null);
              setError('관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.');
              await firebaseService.auth.logout(); // 자동 로그아웃
            } else if (userData.status === 'inactive') {
              // 비활성화된 계정은 로그인 불가
              setUser(null);
              setError('비활성화된 계정입니다. 관리자에게 문의하세요.');
              await firebaseService.auth.logout(); // 자동 로그아웃
            } else {
              // 활성화된 계정만 로그인 허용
              const userProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                ...userData
              } as UserProfile;
              
              setUser(userProfile);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error('사용자 정보 가져오기 에러:', err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setIsLoading(false);
    });

    // 자동 로그인 확인
    checkLoginStatus();

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, []);

  /**
   * 로그인 함수
   * @param emailOrEmployeeId 사용자 이메일 또는 사번
   * @param password 사용자 비밀번호
   * @param rememberMe 로그인 상태 유지 여부
   */
  const login = async (emailOrEmployeeId: string, password: string, rememberMe = false): Promise<boolean> => {
    console.log('🚀 AuthContext 로그인 시작:', { emailOrEmployeeId, rememberMe });
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await firebaseService.auth.login(emailOrEmployeeId, password);
      console.log('📋 로그인 결과:', result);
      
      if (result.success && result.user) {
        setUser(result.user as UserProfile);
        
        // 로그인 상태 유지가 체크되었으면 AsyncStorage에 사용자 정보 저장
        if (rememberMe) {
          await AsyncStorage.setItem('@auth_user', JSON.stringify(result.user));
        }
        
        return true;
      } else {
        setError(result.error || '로그인에 실패했습니다.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 회원가입 함수
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호
   * @param employeeId 사원번호
   * @param name 사용자 이름
   */
  const register = async (
    email: string, 
    password: string, 
    employeeId: string, 
    name: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await firebaseService.auth.register(email, password, employeeId, name);
      
      if (result.success && result.user) {
        // 회원가입 성공 - Firebase에 사용자 정보가 저장됨
        // 승인 대기 상태이므로 로그인하지 않고 성공만 반환
        return true;
      } else {
        setError(result.error || '회원가입에 실패했습니다.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 로그아웃 함수
   */
  const logout = async (): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Firebase 로그아웃
      const result = await firebaseService.auth.logout();
      
      // 로컬 상태 초기화
      setUser(null);
      setError(null);
      
      // AsyncStorage에서 사용자 정보 삭제
      await AsyncStorage.removeItem('@auth_user');
      
      if (result.success) {
        return true;
      } else {
        // Firebase 로그아웃이 실패해도 로컬 상태는 초기화
        console.warn('Firebase 로그아웃 실패, 로컬 상태는 초기화됨:', result.error);
        return true;
      }
    } catch (err: any) {
      // 오류가 발생해도 로컬 상태는 초기화
      console.error('로그아웃 중 오류:', err);
      setUser(null);
      setError(null);
      await AsyncStorage.removeItem('@auth_user');
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 비밀번호 재설정 함수
   * @param email 사용자 이메일
   */
  const resetPassword = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await firebaseService.auth.resetPassword(email);
      
      if (result.success) {
        return true;
      } else {
        setError(result.error || '비밀번호 재설정 이메일 전송에 실패했습니다.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || '비밀번호 재설정 중 오류가 발생했습니다.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 에러 메시지 초기화
   */
  const clearError = () => {
    setError(null);
  };

  // 컨텍스트에 제공할 값
  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    resetPassword,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * 인증 컨텍스트를 사용하기 위한 커스텀 훅
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용할 수 있습니다.');
  }
  
  return context;
};
