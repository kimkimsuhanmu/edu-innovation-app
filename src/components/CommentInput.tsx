import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * CommentInput 컴포넌트 props 타입 정의
 */
interface CommentInputProps {
  isEnabled: boolean;
  isSubmitting: boolean;
  onSubmit: (comment: string) => void;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
}

/**
 * 댓글 입력 컴포넌트
 * 
 * 사용자가 학습 완료 후 댓글을 작성할 수 있는 입력 필드를 제공합니다.
 * 90% 이상 시청 조건이 충족되었을 때만 활성화됩니다.
 */
const CommentInput: React.FC<CommentInputProps> = ({
  isEnabled,
  isSubmitting,
  onSubmit,
  placeholder = '학습 후기를 작성해주세요.',
  minLength = 100,
  maxLength = 500
}) => {
  // 상태 관리
  const [comment, setComment] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);

  /**
   * 댓글 제출 핸들러
   */
  const handleSubmit = () => {
    if (!isEnabled || isSubmitting || comment.trim().length < minLength) {
      return;
    }
    
    onSubmit(comment.trim());
    Keyboard.dismiss();
    setComment('');
  };

  /**
   * 댓글 길이 유효성 검사
   */
  const isValidComment = comment.trim().length >= minLength && comment.trim().length <= maxLength;

  /**
   * 남은 글자 수 계산
   */
  const remainingChars = maxLength - comment.length;

  return (
    <View style={[
      styles.container,
      isFocused && styles.containerFocused
    ]}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={comment}
          onChangeText={setComment}
          placeholder={placeholder}
          placeholderTextColor="#999"
          multiline
          numberOfLines={2}
          maxLength={maxLength}
          editable={isEnabled && !isSubmitting}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        
        <View style={styles.bottomRow}>
          <Text style={[
            styles.charCount,
            remainingChars < 10 && styles.charCountWarning
          ]}>
            {remainingChars}
          </Text>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isEnabled || !isValidComment || isSubmitting) && styles.disabledButton
            ]}
            onPress={handleSubmit}
            disabled={!isEnabled || !isValidComment || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitText}>등록</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    position: 'relative',
  },
  containerFocused: {
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
  },
  charCountWarning: {
    color: '#ff6b6b',
  },
  submitButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#b3d7ff',
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CommentInput;
