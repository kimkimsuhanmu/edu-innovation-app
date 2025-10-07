import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../state/AuthContext';
import { showConfirm, showAlert } from '../utils/AlertUtils';

/**
 * 프로필 화면 컴포넌트
 */
const ProfileScreen: React.FC = () => {
  const { user, logout, isLoading } = useAuth();

  /**
   * 로그아웃 처리
   */
  const handleLogout = async () => {
    try {
      const success = await logout();
      if (!success) {
        showAlert('로그아웃 실패', '로그아웃 중 문제가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('로그아웃 에러:', error);
      showAlert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  /**
   * 로그아웃 확인
   */
  const confirmLogout = () => {
    showConfirm(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      handleLogout
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.nameText}>{user?.displayName || '사용자'}</Text>
        <Text style={styles.emailText}>{user?.email || ''}</Text>
        <Text style={styles.employeeIdText}>사번: {user?.employeeId || '-'}</Text>
      </View>

      <View style={styles.settingsContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={confirmLogout}
          disabled={isLoading}
        >
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  profileContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  emailText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  employeeIdText: {
    fontSize: 16,
    color: '#666',
  },
  settingsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;
