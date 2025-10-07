import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/state/AuthContext';
import AnimatedSplash from './src/components/AnimatedSplash';
import { Platform } from 'react-native';

/**
 * 앱의 루트 컴포넌트
 * 
 * 인증 상태 관리를 위한 AuthProvider를 설정하고
 * 네비게이션 컨테이너와 안전 영역 제공자를 설정합니다.
 * 앱의 메인 네비게이터를 렌더링합니다.
 */
export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      document.title = '김포도시관리공사 e-캠퍼스';
    }
  }, []);

  if (!isReady) {
    return (
      <AnimatedSplash
        logoSource={require('./assets/Logo.png')}
        appName="김포도시관리공사 e-캠퍼스"
        onFinish={() => setIsReady(true)}
      />
    );
  }

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </AuthProvider>
  );
}