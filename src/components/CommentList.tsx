import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import firebaseService from '../services/firebase';
import { useAuth } from '../state/AuthContext';

interface Comment {
  id: string;
  userId: string;
  contentId: string;
  comment: string;
  createdAt: any;
  userDisplayName?: string;
}

interface CommentListProps {
  contentId: string;
}

/**
 * 댓글 목록 컴포넌트
 * 
 * 특정 콘텐츠에 대한 모든 댓글을 표시합니다.
 * 사용자가 댓글을 작성하기 전에도 다른 사용자들의 댓글을 볼 수 있습니다.
 */
const CommentList: React.FC<CommentListProps> = ({ contentId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  
  // 수정 모달 상태
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  /**
   * 댓글 목록 가져오기
   */
  const fetchComments = async () => {
    try {
      console.log('CommentList: Firebase 서비스 호출 시작');
      const result = await firebaseService.comment.getCommentsByContent(contentId);
      console.log('CommentList: Firebase 서비스 응답:', result);
      
      if (result.success && result.comments) {
        console.log('CommentList: 댓글 개수:', result.comments.length);
        setComments(result.comments);
      } else {
        console.error('댓글 가져오기 실패:', result.error);
      }
    } catch (error: any) {
      console.error('댓글 가져오기 에러:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * 새로고침 핸들러
   */
  const handleRefresh = () => {
    setRefreshing(true);
    fetchComments();
  };

  /**
   * 댓글 수정 시작
   */
  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment);
    setEditText(comment.comment);
    setEditModalVisible(true);
  };

  /**
   * 댓글 수정 완료
   */
  const handleUpdateComment = async () => {
    if (!editingComment || !editText.trim()) return;
    
    setIsUpdating(true);
    try {
      const result = await firebaseService.comment.updateComment(
        editingComment.id,
        editText.trim()
      );
      
      if (result.success) {
        // 로컬 상태 업데이트
        setComments(prev => 
          prev.map(comment => 
            comment.id === editingComment.id 
              ? { ...comment, comment: editText.trim() }
              : comment
          )
        );
        setEditModalVisible(false);
        setEditingComment(null);
        setEditText('');
        Alert.alert('완료', '댓글이 수정되었습니다.');
      } else {
        Alert.alert('오류', result.error || '댓글 수정에 실패했습니다.');
      }
    } catch (error: any) {
      console.error('댓글 수정 에러:', error);
      Alert.alert('오류', '댓글 수정 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * 사용자 댓글 삭제 요청 안내
   */
  const handleUserDeleteRequest = () => {
    Alert.alert(
      '댓글 삭제 요청',
      '수료 확인과 관련된 댓글 삭제는 관리자에게 유선으로 요청해주세요.\n\n관리자 연락처: 교육팀 (내선 1234)',
      [{ text: '확인', style: 'default' }]
    );
  };

  /**
   * 관리자 댓글 삭제
   */
  const handleAdminDeleteComment = async (commentId: string) => {
    console.log('=== handleAdminDeleteComment 함수 호출 ===');
    console.log('삭제할 댓글 ID:', commentId);
    console.log('현재 사용자 정보:', {
      uid: user?.uid,
      role: user?.role,
      email: user?.email
    });
    
    // 웹 환경에서는 window.confirm 사용
    const isWeb = Platform.OS === 'web';
    
    if (isWeb) {
      console.log('웹 환경: window.confirm 사용');
      const confirmed = window.confirm(
        '정말로 이 댓글을 삭제하시겠습니까?\n\n⚠️ 주의: 댓글 삭제 시 해당 사용자의 수료 상태가 영향을 받을 수 있습니다.\n\n이 작업은 되돌릴 수 없습니다.'
      );
      
      if (confirmed) {
        console.log('=== 사용자가 삭제 확인 버튼 클릭 (웹) ===');
        await performDelete(commentId);
      } else {
        console.log('사용자가 삭제 취소 (웹)');
      }
    } else {
      // 네이티브 환경에서는 Alert.alert 사용
      Alert.alert(
        '댓글 삭제 확인',
        '정말로 이 댓글을 삭제하시겠습니까?\n\n⚠️ 주의: 댓글 삭제 시 해당 사용자의 수료 상태가 영향을 받을 수 있습니다.\n\n이 작업은 되돌릴 수 없습니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              console.log('=== 사용자가 삭제 확인 버튼 클릭 (네이티브) ===');
              await performDelete(commentId);
            }
          }
        ]
      );
    }
  };

  /**
   * 실제 삭제 수행 함수
   */
  const performDelete = async (commentId: string) => {
    try {
      console.log('=== 댓글 삭제 시작 ===');
      console.log('삭제할 댓글 ID:', commentId);
      console.log('현재 사용자:', user?.uid, user?.role);
      
      // 하드 삭제 시도
      console.log('1단계: 하드 삭제 시도');
      let result = await firebaseService.comment.deleteComment(commentId);
      console.log('하드 삭제 결과:', result);
      
      if (!result.success) {
        console.log('2단계: 소프트 삭제 시도');
        result = await firebaseService.comment.softDeleteComment(commentId);
        console.log('소프트 삭제 결과:', result);
      }

      if (result.success) {
        console.log('삭제 성공! 목록 업데이트 중...');
        // 로컬 상태에서 제거
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        // 원본 재조회로 일관성 확보
        await fetchComments();
        
        // 웹과 네이티브 모두에서 알림 표시
        if (Platform.OS === 'web') {
          alert('댓글이 성공적으로 삭제되었습니다.');
        } else {
          Alert.alert('삭제 완료', '댓글이 성공적으로 삭제되었습니다.');
        }
      } else {
        console.error('=== 삭제 실패 상세 정보 ===');
        console.error('최종 결과:', result);
        console.error('에러 코드:', result.error);
        
        const errorMessage = `댓글 삭제에 실패했습니다.\n\n에러: ${result.error}\n\n관리자에게 문의하세요.`;
        if (Platform.OS === 'web') {
          alert(errorMessage);
        } else {
          Alert.alert('삭제 실패', errorMessage);
        }
      }
    } catch (error: any) {
      console.error('=== 삭제 중 예외 발생 ===');
      console.error('에러 객체:', error);
      console.error('에러 메시지:', error.message);
      console.error('에러 코드:', error.code);
      
      const errorMessage = `댓글 삭제 중 오류가 발생했습니다.\n\n에러: ${error.message}\n\n관리자에게 문의하세요.`;
      if (Platform.OS === 'web') {
        alert(errorMessage);
      } else {
        Alert.alert('삭제 오류', errorMessage);
      }
    }
  };

  /**
   * 권한 체크 함수
   */
  const canEditComment = (comment: Comment) => {
    const role = getUserRoleUpper();
    const originalRole = (user as any).role;
    const isAdminRole = role === 'ADMIN' || originalRole === 'admin';
    const isManagerRole = role === 'MANAGER' || originalRole === 'manager';
    
    return !!user && (comment.userId === user.uid || isAdminRole || isManagerRole);
  };

  const getUserRoleUpper = () => {
    if (!user || !(user as any).role) return undefined;
    const role = String((user as any).role).toUpperCase();
    console.log('사용자 role 변환:', { original: (user as any).role, upper: role });
    return role;
  };

  const canDeleteComment = (comment: Comment) => {
    const role = getUserRoleUpper();
    console.log('=== 댓글 삭제 권한 체크 ===');
    console.log('현재 사용자:', {
      uid: user?.uid,
      role: user?.role,
      roleUpper: role
    });
    console.log('댓글 정보:', {
      commentId: comment.id,
      commentUserId: comment.userId
    });
    
    // 소문자와 대문자 모두 확인
    const originalRole = (user as any).role;
    const isAdminRole = role === 'ADMIN' || originalRole === 'admin';
    const isManagerRole = role === 'MANAGER' || originalRole === 'manager';
    
    const canDelete = !!user && (
      comment.userId === user.uid || // 본인 댓글
      isAdminRole || // 관리자 계정 (대소문자 모두)
      isManagerRole
    );
    
    console.log('삭제 권한 결과:', canDelete);
    console.log('권한 체크 상세:', {
      hasUser: !!user,
      isOwner: comment.userId === user?.uid,
      isAdmin: isAdminRole,
      isManager: isManagerRole,
      originalRole,
      upperRole: role
    });
    
    return canDelete;
  };

  const isAdmin = () => {
    const role = getUserRoleUpper();
    const originalRole = (user as any).role;
    const isAdminRole = role === 'ADMIN' || originalRole === 'admin';
    const isManagerRole = role === 'MANAGER' || originalRole === 'manager';
    const adminResult = !!user && (isAdminRole || isManagerRole);
    
    console.log('=== 관리자 권한 체크 ===');
    console.log('사용자 정보:', {
      uid: user?.uid,
      role: user?.role,
      roleUpper: role
    });
    console.log('관리자 여부:', adminResult);
    console.log('관리자 체크 상세:', {
      isAdminRole,
      isManagerRole,
      originalRole,
      upperRole: role
    });
    return adminResult;
  };

  /**
   * 컴포넌트 마운트 시 댓글 목록 가져오기
   */
  useEffect(() => {
    console.log('CommentList: 댓글 목록 가져오기 시작, contentId:', contentId);
    console.log('CommentList: 현재 사용자 정보:', user);
    console.log('CommentList: 사용자 role:', user?.role);
    fetchComments();
  }, [contentId]);

  /**
   * 날짜 포맷팅
   */
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else if (diffInHours < 168) { // 7일
      return `${Math.floor(diffInHours / 24)}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

      /**
       * 사용자 이름 마스킹 (2번째 글자만 별표 처리)
       */
      const maskUserName = (displayName: string) => {
        if (!displayName) return '익명';
        
        // 이메일인 경우 @ 앞부분만 마스킹
        if (displayName.includes('@')) {
          const [localPart, domain] = displayName.split('@');
          if (localPart.length <= 2) {
            return localPart.charAt(0) + '*@' + domain;
          } else {
            return localPart.charAt(0) + '*'.repeat(localPart.length - 2) + localPart.charAt(localPart.length - 1) + '@' + domain;
          }
        }
        
        // 일반 이름인 경우 - 2번째 글자만 별표 처리
        if (displayName.length <= 1) {
          return displayName;
        } else if (displayName.length === 2) {
          return displayName.charAt(0) + '*';
        } else {
          return displayName.charAt(0) + '*' + displayName.substring(2);
        }
      };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>댓글을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={20} color="#007AFF" />
        <Text style={styles.headerText}>
          학습 후기 ({comments.length}개)
        </Text>
      </View>
      
      {comments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
          <Text style={styles.emptyText}>
            아직 작성된 학습 후기가 없습니다.
          </Text>
          <Text style={styles.emptySubText}>
            90% 이상 시청 후 첫 번째 후기를 작성해보세요!
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.commentsContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentHeader}>
                <Text style={styles.userName}>
                  {maskUserName(comment.userDisplayName || '익명')}
                </Text>
                <View style={styles.commentHeaderRight}>
                  <Text style={styles.commentDate}>
                    {formatDate(comment.createdAt)}
                  </Text>
                  {(canEditComment(comment) || canDeleteComment(comment)) && (
                    <View style={styles.actionButtons}>
                      {canEditComment(comment) && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditComment(comment)}
                        >
                          <Ionicons name="create-outline" size={16} color="#007AFF" />
                          <Text style={styles.actionButtonText}>수정</Text>
                        </TouchableOpacity>
                      )}
                      {canDeleteComment(comment) && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => {
                            console.log('=== 삭제 버튼 클릭 ===');
                            console.log('클릭된 댓글:', {
                              id: comment.id,
                              userId: comment.userId,
                              comment: comment.comment
                            });
                            console.log('현재 사용자:', {
                              uid: user?.uid,
                              role: user?.role
                            });
                            console.log('isAdmin() 결과:', isAdmin());
                            
                            if (isAdmin()) {
                              console.log('관리자 삭제 함수 호출');
                              handleAdminDeleteComment(comment.id);
                            } else {
                              console.log('일반 사용자 삭제 요청');
                              handleUserDeleteRequest();
                            }
                          }}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
                          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.commentText}>
                {comment.comment}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 댓글 수정 모달 */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>댓글 수정</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              placeholder="댓글을 수정해주세요..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
                disabled={isUpdating}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateComment}
                disabled={isUpdating || !editText.trim()}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  commentsContainer: {
    maxHeight: 300,
  },
  commentItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentDate: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 4,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    fontSize: 12,
    marginLeft: 2,
    color: '#007AFF',
  },
  deleteButtonText: {
    color: '#FF3B30',
  },
  commentText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
});

export default CommentList;
