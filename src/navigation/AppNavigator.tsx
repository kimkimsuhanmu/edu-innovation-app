import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../state/AuthContext';
import AppHeader from '../components/AppHeader';

// 스크린 임포트
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PendingApprovalScreen from '../screens/PendingApprovalScreen';
import HomeScreen from '../screens/HomeScreen';
import CurationScreen from '../screens/CurationScreen';
import CurationDetailScreen from '../screens/CurationDetailScreen';
import MyLearningScreen from '../screens/MyLearningScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlayerScreen from '../screens/PlayerScreen';

// 타입 정의
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  PlayerScreen: { contentId: string };
  CurationDetail: { curationId: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PendingApproval: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Curation: undefined;
  MyLearning: undefined;
  Profile: undefined;
};

// 스택 네비게이터 생성
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

/**
 * 인증 관련 화면들을 위한 스택 네비게이터
 */
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="PendingApproval" component={PendingApprovalScreen} />
    </AuthStack.Navigator>
  );
};

/**
 * 메인 탭 네비게이터
 * 앱의 주요 기능 화면들을 포함합니다.
 */
const MainNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Curation') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'MyLearning') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-circle';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 12 },
        headerShown: true,
        header: () => <AppHeader />,
      })}
    >
      <MainTab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: '', tabBarLabel: '홈' }}
      />
      <MainTab.Screen 
        name="Curation" 
        component={CurationScreen} 
        options={{ title: '', tabBarLabel: '큐레이션' }}
      />
      <MainTab.Screen 
        name="MyLearning" 
        component={MyLearningScreen} 
        options={{ title: '', tabBarLabel: '내 학습' }}
      />
      <MainTab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: '', tabBarLabel: '프로필' }}
      />
    </MainTab.Navigator>
  );
};

// 탭 이름을 한국어로 변환하는 함수
const getTabTitle = (routeName: string): string => {
  switch (routeName) {
    case 'Home':
      return '홈';
    case 'Curation':
      return '큐레이션';
    case 'MyLearning':
      return '내 학습';
    case 'Profile':
      return '프로필';
    default:
      return '';
  }
};

/**
 * 로딩 화면 컴포넌트
 */
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#007bff" />
  </View>
);

/**
 * 앱의 루트 네비게이터
 * 인증 상태에 따라 Auth 또는 Main 화면으로 분기합니다.
 */
const AppNavigator = () => {
  // 인증 컨텍스트에서 사용자 정보와 로딩 상태 가져오기
  const { user, isLoading } = useAuth();

  // 로딩 중일 때는 로딩 화면 표시
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // 로그인하지 않은 경우 인증 화면으로 이동
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        // 로그인한 경우 메인 화면으로 이동
        <RootStack.Screen name="Main" component={MainNavigator} />
      )}
      <RootStack.Screen 
        name="PlayerScreen" 
        component={PlayerScreen}
        options={{ 
          headerShown: true,
          header: () => <AppHeader title="학습 콘텐츠" showBackButton={true} />,
        }}
      />
      <RootStack.Screen 
        name="CurationDetail" 
        component={CurationDetailScreen}
        options={{ 
          headerShown: true,
          header: () => <AppHeader title="큐레이션 상세" showBackButton={true} />,
        }}
      />
    </RootStack.Navigator>
  );
};

export default AppNavigator;