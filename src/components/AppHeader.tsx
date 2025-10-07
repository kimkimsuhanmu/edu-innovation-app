import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform, TouchableOpacity, Linking, Modal, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, showBackButton = false }) => {
  const navigation = useNavigation();
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleLogoPress = () => {
    // 로고 클릭 시 바로 홈페이지로 이동
    Linking.openURL('https://www.guc.or.kr/');
  };

  const handleTitlePress = () => {
    const newClickCount = clickCount + 1;
    setClickCount(newClickCount);

    // 클릭 카운트에 따른 시각적 피드백
    if (newClickCount >= 5) {
      console.log(`이스터 에그 카운트: ${newClickCount}/7`);
    }

    if (newClickCount === 7) {
      // 이스터 에그 활성화
      setShowEasterEgg(true);
      setClickCount(0); // 카운트 리셋
      
      // 애니메이션 시작
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }

    // 3초 후 카운트 리셋
    setTimeout(() => {
      setClickCount(0);
    }, 3000);
  };

  const closeEasterEgg = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowEasterEgg(false);
    });
  };

  return (
    <>
      <View style={styles.container}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBackPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#007bff" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.logoContainer}
          onPress={handleLogoPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Image 
            source={require('../../assets/Logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.titleContainer}
          onPress={handleTitlePress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.appName}>김포도시관리공사</Text>
          <Text style={styles.appSubtitle}>e-캠퍼스</Text>
        </TouchableOpacity>
      </View>

      {/* 이스터 에그 모달 */}
      <Modal
        visible={showEasterEgg}
        transparent={true}
        animationType="none"
        onRequestClose={closeEasterEgg}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.easterEggCard,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }]
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={32} color="#ff6b9d" />
              <Text style={styles.cardTitle}>💕 특별한 메시지 💕</Text>
            </View>
            
            <View style={styles.cardContent}>
              <Text style={styles.messageText}>
                국민요정 강가휘 포에버
              </Text>
              <Text style={styles.subMessageText}>
                💖 앱 개발자가 사랑하는 아내에게 바치는 특별한 이벤트(이스터에그) 💖
              </Text>
            </View>
            
            <View style={styles.cardButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.buttonPrimary]}
                onPress={closeEasterEgg}
              >
                <Text style={styles.buttonText}>행복하세요</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary]}
                onPress={closeEasterEgg}
              >
                <Text style={styles.buttonText}>응원합니다</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    ...Platform.select({
      web: {
        paddingTop: 8,
        paddingBottom: 8,
      },
    }),
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  logoContainer: {
    marginRight: 12,
    padding: 4,
  },
  logo: {
    width: 40,
    height: 40,
  },
  titleContainer: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    lineHeight: 20,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
    lineHeight: 18,
  },
  pageTitle: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
    lineHeight: 16,
  },
  // 이스터 에그 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  easterEggCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b9d',
    marginTop: 8,
    textAlign: 'center',
  },
  cardContent: {
    alignItems: 'center',
    marginBottom: 24,
  },
  messageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  subMessageText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#ff6b9d',
  },
  buttonSecondary: {
    backgroundColor: '#007bff',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default AppHeader;
