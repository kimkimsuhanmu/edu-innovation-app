import React from 'react';
import { Platform, Alert } from 'react-native';

/**
 * 플랫폼별 알림 표시 함수
 * 웹에서는 window.alert, 모바일에서는 Alert.alert 사용
 */
export const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    // 웹 환경에서는 브라우저 기본 알림 사용
    if (buttons && buttons.length > 0) {
      // 확인 버튼이 있는 경우
      const result = window.confirm(`${title}\n\n${message}`);
      if (result && buttons[0].onPress) {
        buttons[0].onPress();
      }
    } else {
      // 단순 알림
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    // 모바일 환경에서는 React Native Alert 사용
    if (buttons && buttons.length > 0) {
      Alert.alert(title, message, buttons);
    } else {
      Alert.alert(title, message);
    }
  }
};

/**
 * 확인 대화상자 표시
 */
export const showConfirm = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      onConfirm();
    } else if (onCancel) {
      onCancel();
    }
  } else {
    Alert.alert(
      title,
      message,
      [
        { text: '취소', onPress: onCancel, style: 'cancel' },
        { text: '확인', onPress: onConfirm }
      ]
    );
  }
};
