import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
  Dimensions,
  StatusBar,
  Platform,
  AppState,
  AppStateStatus,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Video, { OnLoadData, OnProgressData } from 'react-native-video';
import NetInfo from '@react-native-community/netinfo';
import BackgroundTimer from 'react-native-background-timer';
// 웹 환경에서는 react-native-keep-awake를 사용하지 않음
let useKeepAwake: () => void;
if (Platform.OS !== 'web') {
  try {
    const keepAwakeModule = require('react-native-keep-awake');
    useKeepAwake = keepAwakeModule.useKeepAwake;
  } catch (error) {
    useKeepAwake = () => {}; // 빈 함수로 대체
  }
} else {
  useKeepAwake = () => {}; // 웹에서는 빈 함수
}

import firebaseService, { likeService, favoriteService } from '../services/firebase';
import { useAuth } from '../state/AuthContext';
import VideoCache from '../utils/VideoCache';
import VideoControls from '../components/VideoControls';
import CommentInput from '../components/CommentInput';
import CommentList from '../components/CommentList';
import eventBus, { EVENTS } from '../utils/EventBus';

type PlayerScreenRouteProp = RouteProp<RootStackParamList, 'PlayerScreen'>;

/**
 * 콘텐츠 플레이어 화면 컴포넌트
 * 
 * PRD F-03 명세에 따라 구현:
 * 1. 영상/음성 모드 전환 기능
 * 2. 자동 캐싱 기능
 * 3. 백그라운드 재생 기능
 * 
 * PRD F-04 명세에 따라 구현:
 * 1. 90% 이상 시청 여부 판별 로직
 * 2. 댓글 입력 및 수료 처리 기능
 */
const PlayerScreen: React.FC = () => {
  // 화면을 켜진 상태로 유지 (영상 모드에서만)
  useKeepAwake();
  
  // 인증 상태
  const { user } = useAuth();
  
  // 네비게이션 및 라우트 훅
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<PlayerScreenRouteProp>();
  const { contentId } = route.params;
  
  // 비디오 참조
  const videoRef = useRef<any>(null);
  
  // 상태 관리
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isAudioMode, setIsAudioMode] = useState<boolean>(false);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [videoSource, setVideoSource] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isBackgroundPlaying, setIsBackgroundPlaying] = useState<boolean>(false);
  
  // 웹 환경 감지
  const isWeb = Platform.OS === 'web';
  
  // 수료 관련 상태
  const [watchedEnough, setWatchedEnough] = useState<boolean>(false);
  const [maxWatchedTime, setMaxWatchedTime] = useState<number>(0); // 최대 시청 시간 (초)
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [commentRefreshKey, setCommentRefreshKey] = useState<number>(0);
  
  // 추천/즐겨찾기 상태
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState<boolean>(true);
  
  // 이어듣기 관련 상태
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [resumeTime, setResumeTime] = useState(0);
  const [resumeProgress, setResumeProgress] = useState(0);
  
  // 백그라운드 타이머 ID
  const backgroundTimerRef = useRef<number | null>(null);
  
  // 앱 상태 변경 감지 (백그라운드 재생 처리)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('앱 상태 변경:', nextAppState);
      
      // 앱이 백그라운드로 전환될 때
      if (nextAppState === 'background') {
        console.log('앱 백그라운드 전환');
        
        // 음성 모드이고 재생 중이면 백그라운드 재생 시작
        if (isAudioMode && isPlaying) {
          console.log('음성 모드 백그라운드 재생 시작');
          startBackgroundPlayback();
        }
        
        // 실시간 저장으로 대체됨
      }
      // 앱이 포그라운드로 전환될 때
      else if (nextAppState === 'active') {
        console.log('앱 포그라운드 전환');
        
        if (isBackgroundPlaying) {
          console.log('백그라운드 재생 중지');
          stopBackgroundPlayback();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      stopBackgroundPlayback();
    };
  }, [isAudioMode, isPlaying, isBackgroundPlaying]);

  // 뒤로가기 버튼 핸들링
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      console.log('뒤로가기 버튼 클릭됨');
      
      if (isFullscreen) {
        console.log('전체화면 모드에서 뒤로가기 - 전체화면 해제');
        toggleFullscreen();
        return true;
      }
      
      // 실시간 저장으로 대체됨
      
      return false;
    });

    return () => backHandler.remove();
  }, [isFullscreen, maxWatchedTime, currentTime, duration]);

  // 콘텐츠 정보 로드
  useEffect(() => {
    loadContent();
  }, [contentId]);

  // 학습 진행률 로드
  useEffect(() => {
    loadLearningProgress();
  }, [contentId, user]);

  /**
   * 학습 시청 시간 로드
   */
  const loadLearningProgress = async () => {
    try {
      if (!user || !contentId) {
        console.log('학습 시청 시간 로드 건너뜀: 사용자 또는 콘텐츠 ID 없음', { user: !!user, contentId });
        return;
      }

      console.log('학습 시청 시간 로드 시작:', { userId: user.uid, contentId });
      const result = await firebaseService.learning.getLearningProgress(user.uid, contentId);
      
      if (result.success && result.watchedTime !== undefined) {
        console.log('학습 시청 시간 로드 성공:', { watchedTime: result.watchedTime });
        setMaxWatchedTime(result.watchedTime);
        setCurrentTime(result.watchedTime);
        
        // 이어듣기: 시청 시간이 5초 이상일 때만 팝업 표시 (콘텐츠 진입 시에만)
        if (result.watchedTime >= 5) {
          setResumeTime(result.watchedTime);
          setResumeProgress(Math.floor((result.watchedTime / (content?.duration || 1)) * 100));
          setShowResumeDialog(true);
          console.log('이어듣기 다이얼로그 표시:', { 
            watchedTime: result.watchedTime, 
            resumeTime: result.watchedTime, 
            duration: content?.duration 
          });
        } else {
          console.log('이어듣기 다이얼로그 표시 안함:', { 
            watchedTime: result.watchedTime, 
            reason: result.watchedTime < 5 ? '시청 시간 부족 (5초 미만)' : '시청 시간 없음' 
          });
        }
      } else {
        console.log('학습 시청 시간 로드 실패 또는 시청 시간 없음:', result);
        setMaxWatchedTime(0);
      }
    } catch (error: any) {
      console.error('학습 시청 시간 로드 에러:', error);
      setMaxWatchedTime(0);
    }
  };

  // 수료 상태 확인
  useEffect(() => {
    checkCompletionStatus();
  }, []);

  // 전체화면 상태 감지 (웹용)
  useEffect(() => {
    if (isWeb) {
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [isWeb]);

  /**
   * 수료 상태 확인
   */
  const checkCompletionStatus = async () => {
    try {
      if (!user) {
        setIsCheckingCompletion(false);
        return;
      }
      
      // 현재 사용자의 수료한 과정 목록 가져오기
      const result = await firebaseService.learning.getCompletedContents(user.uid);
      
      if (result.success && result.records) {
        // 현재 콘텐츠가 이미 수료되었는지 확인
        const isAlreadyCompleted = result.records.some(record => record.contentId === contentId);
        setIsCompleted(isAlreadyCompleted);
        
        if (isAlreadyCompleted) {
          setWatchedEnough(true);
        }
        
        console.log('수료 상태 확인 결과:', {
          contentId,
          isCompleted: isAlreadyCompleted,
          totalCompletedRecords: result.records.length
        });
      } else {
        console.log('수료 상태 확인 실패:', result.error);
        setIsCompleted(false);
      }
    } catch (err) {
      console.error('수료 상태 확인 에러:', err);
      setIsCompleted(false);
    }
  };

  /**
   * 콘텐츠 정보 로드
   */
  const loadContent = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // 현재 인증 상태 확인
      const currentUser = firebaseService.firebaseAuth.currentUser;
      console.log('현재 로그인된 사용자:', currentUser ? currentUser.email : '없음');
      
      // 콘텐츠 상세 정보 가져오기
      const result = await firebaseService.content.getContentDetails(contentId);
      
      if (result.success && result.content) {
        setContent(result.content);
        setLikeCount(result.content.likeCount || 0);
        
        // 조회수 증가
        await firebaseService.content.incrementViewCount(contentId);
        
        // 조회수 증가 이벤트 발생
        eventBus.emit(EVENTS.VIEW_COUNT_CHANGED, {
          contentId,
          viewCount: (result.content.viewCount || 0) + 1
        });
        
        // 캐시 상태 확인 (웹 환경이 아닐 때만)
        if (!isWeb) {
          const cacheStatus = await VideoCache.getCacheStatus(contentId);
          setIsCached(cacheStatus.isCached);
        } else {
          setIsCached(false); // 웹에서는 항상 캐시되지 않은 것으로 표시
        }
        
        // 비디오 소스 설정
        await setupVideoSource(result.content);
        
        // 추천/즐겨찾기 상태 확인
        if (user) {
          console.log('추천/즐겨찾기 상태 확인 시작:', { userId: user.uid, contentId });
          
          const [likeResult, favoriteResult] = await Promise.all([
            likeService.isLiked(user.uid, contentId),
            favoriteService.isFavorite(user.uid, contentId)
          ]);
          
          console.log('추천 상태 결과:', likeResult);
          console.log('즐겨찾기 상태 결과:', favoriteResult);
          
          if (likeResult.success) {
            setIsLiked(likeResult.isLiked);
          }
          
          if (favoriteResult.success) {
            setIsFavorite(favoriteResult.isFavorite);
          }
        } else {
          console.log('사용자가 로그인되지 않음, 추천/즐겨찾기 상태 확인 건너뜀');
        }
      } else {
        console.error('콘텐츠 로드 실패:', result.error);
        setError('콘텐츠를 불러올 수 없습니다.');
      }
    } catch (err: any) {
      console.error('콘텐츠 로드 에러:', err);
      setError(err.message || '콘텐츠를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 비디오 소스 설정
   */
  const setupVideoSource = async (contentData: any) => {
    try {
      console.log('콘텐츠 데이터:', contentData);
      
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected === true;
      
      // 비디오 URL
      const videoUrl = contentData.videoUrl;
      const audioUrl = contentData.audioUrl;
      const url = isAudioMode ? audioUrl : videoUrl;
      
      console.log('비디오 URL:', videoUrl);
      console.log('오디오 URL:', audioUrl);
      console.log('사용할 URL:', url);
      console.log('오디오 모드:', isAudioMode);
      
      // URL 유효성 검사
      if (!url || url.trim() === '') {
        // 오디오 모드인데 오디오 URL이 없는 경우 비디오 URL 사용
        if (isAudioMode && !audioUrl && videoUrl) {
          console.log('오디오 URL이 없어서 비디오 URL을 사용합니다.');
          setVideoSource({ uri: videoUrl });
          setIsCached(false);
          return;
        }
        throw new Error('비디오/오디오 URL이 없습니다.');
      }
      
      // 웹 환경이 아닐 때만 캐시 기능 사용
      if (!isWeb) {
        // 캐시된 파일 확인
        const cachedPath = await VideoCache.getCachedContent(
          url,
          contentId,
          isAudioMode ? 'audio' : 'video'
        );
        
        if (cachedPath) {
          // 캐시된 파일 사용
          setVideoSource({ uri: cachedPath });
          setIsCached(true);
        } else if (isConnected) {
          // 네트워크 연결이 있으면 원본 URL 사용
          setVideoSource({ uri: url });
          
          // 백그라운드에서 캐싱 시작
          cacheContent(url);
        } else {
          // 네트워크 연결이 없고 캐시된 파일도 없으면 에러
          setError('오프라인 상태에서는 이 콘텐츠를 재생할 수 없습니다. 인터넷에 연결하고 다시 시도하세요.');
        }
      } else {
        // 웹 환경에서는 항상 원본 URL 사용
        setVideoSource({ uri: url });
        setIsCached(false);
      }
    } catch (err: any) {
      console.error('비디오 소스 설정 에러:', err);
      setError(err.message || '비디오 소스를 설정하는 중 오류가 발생했습니다.');
    }
  };

  /**
   * 콘텐츠 캐싱 (웹 환경이 아닐 때만)
   */
  const cacheContent = async (url: string) => {
    // 웹 환경에서는 캐싱하지 않음
    if (isWeb) {
      return;
    }
    
    try {
      await VideoCache.cacheContent(
        url,
        contentId,
        isAudioMode ? 'audio' : 'video'
      );
      setIsCached(true);
    } catch (err) {
      console.error('콘텐츠 캐싱 에러:', err);
      // 캐싱 실패는 사용자에게 알리지 않음 (스트리밍으로 계속 재생)
    }
  };

  /**
   * 비디오 로드 완료 핸들러
   */
  const handleLoad = (data: OnLoadData | any) => {
    let videoDuration = 0;
    
    if (isWeb) {
      // 웹 환경에서는 HTML5 video 이벤트
      const videoElement = data.target;
      videoDuration = videoElement.duration;
      setDuration(videoDuration);
      setIsBuffering(false);
      console.log('비디오 로드 완료 (웹):', videoDuration);
    } else {
      // 네이티브 환경에서는 React Native Video 이벤트
      videoDuration = data.duration;
      setDuration(videoDuration);
      setIsBuffering(false);
      console.log('비디오 로드 완료 (네이티브):', data);
    }
    
    // 이어듣기 팝업은 loadLearningProgress에서만 처리 (콘텐츠 진입 시에만)
    
    // 학습 기록 업데이트 (진행 중)
    updateLearningProgress(0);
  };

  /**
   * 비디오 진행 상태 핸들러
   */
  const handleProgress = (data: OnProgressData | any) => {
    if (isWeb) {
      // 웹 환경에서는 HTML5 video 이벤트
      const videoElement = data.target;
      setCurrentTime(videoElement.currentTime);
      
      // 현재 진행률 계산 (duration이 0이면 계산하지 않음)
      const progress = duration > 0 ? Math.floor((videoElement.currentTime / duration) * 100) : 0;
      
      console.log('비디오 진행률 업데이트 (웹):', {
        currentTime: videoElement.currentTime,
        duration,
        progress,
        maxWatchedTime
      });
      
      // 최대 시청 시간 업데이트
      if (videoElement.currentTime > maxWatchedTime) {
        setMaxWatchedTime(videoElement.currentTime);
        console.log('최대 시청 시간 업데이트:', videoElement.currentTime);
        
        // 시청 시간이 업데이트될 때마다 무조건 저장 (간단한 로직)
        console.log('시청 시간 업데이트 시 자동 저장:', videoElement.currentTime);
        updateLearningProgress(videoElement.currentTime);
      }
      
      // 90% 이상 시청 여부 확인
      if (progress >= 90 && !watchedEnough) {
        setWatchedEnough(true);
        console.log('90% 이상 시청 완료, 댓글 작성 가능');
        Alert.alert(
          '학습 완료 조건 충족',
          '90% 이상 시청하셨습니다. 학습 완료를 위해 하단에 댓글을 작성해주세요.'
        );
      }
      
      // 실시간 저장 주기는 제거 (효율성 개선)
    } else {
      // 네이티브 환경에서는 React Native Video 이벤트
      setCurrentTime(data.currentTime);
      
      // 현재 진행률 계산 (duration이 0이면 계산하지 않음)
      const progress = duration > 0 ? Math.floor((data.currentTime / duration) * 100) : 0;
      
      console.log('비디오 진행률 업데이트 (네이티브):', {
        currentTime: data.currentTime,
        duration,
        progress,
        maxWatchedTime
      });
      
      // 최대 시청 시간 업데이트
      if (data.currentTime > maxWatchedTime) {
        setMaxWatchedTime(data.currentTime);
        console.log('최대 시청 시간 업데이트:', data.currentTime);
        
        // 시청 시간이 업데이트될 때마다 무조건 저장 (간단한 로직)
        console.log('시청 시간 업데이트 시 자동 저장:', data.currentTime);
        updateLearningProgress(data.currentTime);
      }
      
      // 90% 이상 시청 여부 확인
      if (progress >= 90 && !watchedEnough) {
        setWatchedEnough(true);
        console.log('90% 이상 시청 완료, 댓글 작성 가능');
        Alert.alert(
          '학습 완료 조건 충족',
          '90% 이상 시청하셨습니다. 학습 완료를 위해 하단에 댓글을 작성해주세요.'
        );
      }
      
      // 실시간 저장 주기는 제거 (효율성 개선)
    }
  };

  /**
   * 비디오 종료 핸들러
   */
  const handleEnd = () => {
    console.log('비디오 재생 완료 - 진행률 저장');
    setIsPlaying(false);
    setCurrentTime(duration);
    
    // 최대 시청 시간을 전체 길이로 설정
    setMaxWatchedTime(duration);
    setWatchedEnough(true);
    
    // 학습 진도 100% 업데이트
    updateLearningProgress(100);
    
    // 아직 완료되지 않았다면 알림 표시
    if (!isCompleted) {
      Alert.alert(
        '학습 완료 조건 충족',
        '영상을 모두 시청하셨습니다. 학습 완료를 위해 하단에 댓글을 작성해주세요.'
      );
    }
  };

  /**
   * 추천 토글 핸들러
   */
  const handleLikeToggle = async () => {
    if (!user || !content) return;
    
    try {
      const result = await likeService.toggleLike(user.uid, contentId);
      
      if (result.success) {
        setIsLiked(result.isLiked);
        setLikeCount(prev => result.isLiked ? prev + 1 : prev - 1);
        
        // 전역 이벤트 발생 - 다른 컴포넌트들이 즉시 반영할 수 있도록
        eventBus.emit(EVENTS.LIKE_CHANGED, {
          contentId,
          isLiked: result.isLiked,
          likeCount: result.isLiked ? likeCount + 1 : likeCount - 1
        });
        
        console.log('추천 토글 성공, 이벤트 발생:', {
          contentId,
          isLiked: result.isLiked,
          newLikeCount: result.isLiked ? likeCount + 1 : likeCount - 1
        });
      } else {
        Alert.alert('오류', result.error || '추천 처리 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('추천 토글 에러:', error);
      Alert.alert('오류', '추천 처리 중 오류가 발생했습니다.');
    }
  };

  /**
   * 즐겨찾기 토글 핸들러
   */
  const handleFavoriteToggle = async () => {
    console.log('=== 즐겨찾기 버튼 클릭됨 ===');
    console.log('현재 상태:', { user: !!user, content: !!content, contentId, isFavorite });
    
    if (!user || !content) {
      console.log('즐겨찾기 토글 실패: 사용자 또는 콘텐츠 없음', { user: !!user, content: !!content });
      return;
    }
    
    const currentUserId = user.uid;
    console.log('즐겨찾기 토글 시작:', { userId: currentUserId, contentId, currentState: isFavorite });
    
    try {
      console.log('favoriteService 호출 전:', { userId: currentUserId, contentId });
      const result = await favoriteService.toggleFavorite(currentUserId, contentId);
      
      console.log('즐겨찾기 토글 결과:', result);
      
      if (result.success) {
        setIsFavorite(result.isFavorite);
        
        // 전역 이벤트 발생 - 다른 컴포넌트들이 즉시 반영할 수 있도록
        const eventData = {
          contentId,
          isFavorite: result.isFavorite,
          userId: currentUserId
        };
        
        console.log('=== 즐겨찾기 이벤트 발생 ===');
        console.log('이벤트 데이터:', eventData);
        console.log('이벤트 타입:', EVENTS.FAVORITE_CHANGED);
        
        eventBus.emit(EVENTS.FAVORITE_CHANGED, eventData);
        
        console.log('즐겨찾기 토글 성공, 이벤트 발생 완료:', {
          contentId,
          isFavorite: result.isFavorite,
          userId: currentUserId
        });
        
        Alert.alert(
          result.isFavorite ? '즐겨찾기 추가' : '즐겨찾기 제거',
          result.isFavorite ? '즐겨찾기에 추가되었습니다.' : '즐겨찾기에서 제거되었습니다.'
        );
      } else {
        console.error('즐겨찾기 토글 실패:', result.error);
        Alert.alert('오류', result.error || '즐겨찾기 처리 중 오류가 발생했습니다.');
      }
    } catch (error: any) {
      console.error('즐겨찾기 토글 에러:', error);
      Alert.alert('오류', '즐겨찾기 처리 중 오류가 발생했습니다.');
    }
  };

  /**
   * 비디오 에러 핸들러
   */
  const handleError = (err: any) => {
    console.error('비디오 재생 에러:', err);
    
    // 웹 환경에서 더 자세한 오류 정보 수집
    if (isWeb && videoRef.current) {
      const videoElement = videoRef.current as HTMLVideoElement;
      console.error('비디오 요소 상태:', {
        src: videoElement.src,
        currentSrc: videoElement.currentSrc,
        networkState: videoElement.networkState,
        readyState: videoElement.readyState,
        error: videoElement.error
      });
    }
    
    // 더 자세한 오류 메시지 제공
    let errorMessage = '비디오를 재생할 수 없습니다.';
    
    if (err.error && err.error.code) {
      switch (err.error.code) {
        case 'NotSupportedError':
          errorMessage = '이 비디오 형식은 지원되지 않습니다.';
          break;
        case 'NetworkError':
          errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.';
          break;
        case 'MediaError':
          errorMessage = '미디어 파일에 문제가 있습니다.';
          break;
        default:
          errorMessage = `비디오 재생 오류: ${err.error.code}`;
      }
    } else if (err.target && err.target.error) {
      // HTML5 video 오류 처리
      const videoError = err.target.error;
      switch (videoError.code) {
        case 1: // MEDIA_ERR_ABORTED
          errorMessage = '비디오 로딩이 중단되었습니다.';
          break;
        case 2: // MEDIA_ERR_NETWORK
          errorMessage = '네트워크 오류로 비디오를 로드할 수 없습니다.';
          break;
        case 3: // MEDIA_ERR_DECODE
          errorMessage = '비디오 디코딩 오류가 발생했습니다.';
          break;
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          errorMessage = '지원되지 않는 비디오 형식입니다.';
          break;
        default:
          errorMessage = `비디오 오류 (코드: ${videoError.code})`;
      }
    }
    
    setError(errorMessage);
    setIsBuffering(false);
  };

  /**
   * 버퍼링 시작 핸들러
   */
  const handleBuffer = ({ isBuffering }: { isBuffering: boolean }) => {
    setIsBuffering(isBuffering);
  };

  /**
   * 재생/일시정지 토글
   */
  const togglePlayPause = () => {
    if (isWeb && videoRef.current) {
      // 웹 환경에서는 HTML5 video 요소 직접 제어
      const videoElement = videoRef.current as HTMLVideoElement;
      try {
        if (videoElement.paused) {
          videoElement.play().then(() => {
            setIsPlaying(true);
            console.log('비디오 재생 시작');
          }).catch((error) => {
            console.error('비디오 재생 실패:', error);
            setError('비디오 재생에 실패했습니다.');
          });
        } else {
          videoElement.pause();
          setIsPlaying(false);
          console.log('비디오 일시정지');
          // 실시간 저장으로 대체됨
        }
      } catch (error) {
        console.error('비디오 컨트롤 오류:', error);
        setError('비디오 컨트롤에 실패했습니다.');
      }
    } else {
      // 네이티브 환경에서는 상태만 변경
      const nextPlaying = !isPlaying;
      setIsPlaying(nextPlaying);
      if (!nextPlaying) {
        // 실시간 저장으로 대체됨
      }
    }
  };

  /**
   * 5초 앞으로 이동
   */
  const seekForward = () => {
    if (!duration) return;
    if (!isCompleted) {
      console.log('수료 전에는 5초 앞으로 이동이 비활성화됩니다.');
      return;
    }
    
    const newTime = Math.min(currentTime + 5, duration);
    handleSeek(newTime);
    console.log(`5초 앞으로 이동: ${currentTime}초 → ${newTime}초`);
  };

  /**
   * 5초 뒤로 이동
   */
  const seekBackward = () => {
    if (!duration) return;
    if (!isCompleted) {
      console.log('수료 전에는 5초 뒤로 이동이 비활성화됩니다.');
      return;
    }
    
    const newTime = Math.max(currentTime - 5, 0);
    handleSeek(newTime);
    console.log(`5초 뒤로 이동: ${currentTime}초 → ${newTime}초`);
  };

  /**
   * 영상/음성 모드 토글
   */
  const toggleAudioMode = async () => {
    // 현재 재생 위치 저장
    const currentPosition = currentTime;
    const wasPlaying = isPlaying;
    
    console.log('오디오 모드 토글:', { from: isAudioMode, to: !isAudioMode, wasPlaying });
    
    // 모드 전환
    setIsAudioMode(!isAudioMode);
    
    // 비디오 소스 재설정
    if (content) {
      await setupVideoSource(content);
      
      // 이전 재생 위치로 이동
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.seek(currentPosition);
          
          // 음성 모드로 전환되고 재생 중이었다면 백그라운드 재생 시작
          if (!isAudioMode && wasPlaying) {
            console.log('음성 모드 전환 후 백그라운드 재생 시작');
            startBackgroundPlayback();
          }
        }
      }, 500);
    }
  };

  /**
   * 이어듣기 핸들러
   */
  const handleResume = () => {
    console.log('이어듣기 버튼 클릭:', { resumeTime, videoRef: !!videoRef.current });
    
    if (videoRef.current && resumeTime > 0) {
      try {
        if (isWeb) {
          // 웹 환경: HTML5 비디오 요소의 currentTime 속성 설정
          const videoElement = videoRef.current as HTMLVideoElement;
          videoElement.currentTime = resumeTime;
          console.log(`웹 이어듣기: ${resumeTime}초 위치로 이동`);
        } else {
          // 네이티브 환경: seek 함수 사용
          videoRef.current.seek(resumeTime);
          console.log(`네이티브 이어듣기: ${resumeTime}초 위치로 이동`);
        }
        setCurrentTime(resumeTime);
        console.log(`이어듣기 완료: ${resumeTime}초 위치로 이동 (진행률: ${resumeProgress}%)`);
      } catch (error) {
        console.error('이어듣기 실행 에러:', error);
      }
    }
    setShowResumeDialog(false);
  };

  const handleStartFromBeginning = () => {
    console.log('처음부터 버튼 클릭');
    
    if (videoRef.current) {
      try {
        if (isWeb) {
          // 웹 환경: HTML5 비디오 요소의 currentTime 속성 설정
          const videoElement = videoRef.current as HTMLVideoElement;
          videoElement.currentTime = 0;
          console.log('웹 처음부터: 0초 위치로 이동');
        } else {
          // 네이티브 환경: seek 함수 사용
          videoRef.current.seek(0);
          console.log('네이티브 처음부터: 0초 위치로 이동');
        }
        setCurrentTime(0);
        setMaxWatchedTime(0);
        console.log('처음부터 재생 시작');
      } catch (error) {
        console.error('처음부터 재생 에러:', error);
      }
    }
    setShowResumeDialog(false);
  };

  /**
   * 전체화면 토글
   */
  const toggleFullscreen = () => {
    if (isWeb) {
      // 웹 환경에서는 HTML5 Fullscreen API 사용
      const videoElement = videoRef.current;
      if (videoElement) {
        if (document.fullscreenElement) {
          // 전체화면 해제
          document.exitFullscreen().catch(err => {
            console.error('전체화면 해제 에러:', err);
          });
        } else {
          // 전체화면 설정
          videoElement.requestFullscreen().catch(err => {
            console.error('전체화면 설정 에러:', err);
          });
        }
      }
      return;
    }
    
    setIsFullscreen(!isFullscreen);
    
    if (Platform.OS === 'ios') {
      StatusBar.setHidden(!isFullscreen);
    }
  };

  /**
   * 비디오 탐색
   */
  const handleSeek = (time: number) => {
    try {
      console.log('handleSeek 호출:', { time, isWeb, hasVideoRef: !!videoRef.current });
      
      if (isWeb && videoRef.current) {
        // 웹 환경에서는 HTML5 video의 currentTime 사용
        const videoElement = videoRef.current as HTMLVideoElement;
        videoElement.currentTime = time;
        console.log(`웹 seek: ${time}초 위치로 이동`);
      } else if (videoRef.current && !isWeb) {
        // 네이티브 환경에서는 react-native-video의 seek 사용
        if (typeof videoRef.current.seek === 'function') {
          videoRef.current.seek(time);
          console.log(`네이티브 seek: ${time}초 위치로 이동`);
        } else {
          console.error('seek 함수를 사용할 수 없습니다');
        }
      }
      setCurrentTime(time);
    } catch (error) {
      console.error('비디오 seek 에러:', error);
    }
  };

  /**
   * 앞으로 이동 (10초)
   */
  const handleForward = () => {
    if (videoRef.current) {
      const newTime = Math.min(currentTime + 10, duration);
      videoRef.current.seek(newTime);
    }
  };

  /**
   * 뒤로 이동 (10초)
   */
  const handleRewind = () => {
    if (videoRef.current) {
      const newTime = Math.max(currentTime - 10, 0);
      videoRef.current.seek(newTime);
    }
  };

  /**
   * 학습 시청 시간 업데이트 (재시도 로직 포함)
   */
  const updateLearningProgress = async (watchedTime: number, retryCount = 0) => {
    if (!content || !user) return;
    
    try {
      // Firebase에 학습 시청 시간 업데이트
      await firebaseService.learning.updateProgress(
        user.uid, // 현재 로그인한 사용자 ID 사용
        contentId,
        watchedTime
      );
      console.log(`학습 시청 시간 업데이트 성공: ${watchedTime}초`);
    } catch (err) {
      console.error('학습 진도 업데이트 에러:', err);
      
      // 재시도 로직 (최대 2회)
      if (retryCount < 2) {
        console.log(`학습 진도 업데이트 재시도 ${retryCount + 1}/2`);
        setTimeout(() => {
          updateLearningProgress(watchedTime, retryCount + 1);
        }, 1000 * (retryCount + 1)); // 지수 백오프
      }
    }
  };

  // saveProgressNow 함수 제거 - 실시간 저장만 사용

  // 컴포넌트 언마운트 시 마지막 진행률 저장 (보호 장치) - 실시간 저장으로 대체

  /**
   * 댓글 제출 및 수료 처리
   */
  const handleCommentSubmit = async (comment: string) => {
    if (!watchedEnough || isSubmittingComment || isCompleted || !user) {
      return;
    }
    
    console.log('=== 댓글 제출 시작 ===');
    console.log('현재 사용자 정보:', {
      uid: user.uid,
      email: user.email,
      role: user.role
    });
    console.log('댓글 내용:', comment);
    console.log('콘텐츠 ID:', contentId);
    
    setIsSubmittingComment(true);
    
    try {
      // Firebase에 학습 완료 처리
      const result = await firebaseService.learning.completeContent(
        user.uid, // 현재 로그인한 사용자 ID 사용
        contentId,
        comment
      );
      
      if (result.success) {
        setIsCompleted(true);
        setCommentRefreshKey(prev => prev + 1); // 댓글 목록 새로고침
        Alert.alert(
          '수료 완료',
          '학습이 성공적으로 수료 처리되었습니다.',
          [{ text: '확인', style: 'default' }]
        );
      } else {
        Alert.alert('오류', '수료 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } catch (err: any) {
      console.error('수료 처리 에러:', err);
      Alert.alert('오류', err.message || '수료 처리 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * 백그라운드 재생 시작 (음성 모드용)
   */
  const startBackgroundPlayback = () => {
    if (backgroundTimerRef.current !== null) {
      console.log('백그라운드 재생 이미 실행 중');
      return;
    }
    
    console.log('백그라운드 재생 시작 - 음성 모드');
    
    // 백그라운드 타이머 시작 (1초마다 진행률 업데이트)
    backgroundTimerRef.current = BackgroundTimer.setInterval(() => {
      setCurrentTime((prevTime) => {
        const newTime = prevTime + 1;
        
        // 동영상이 끝나면 타이머 중지
        if (newTime >= duration) {
          console.log('백그라운드 재생 완료');
          stopBackgroundPlayback();
          setIsPlaying(false);
          updateLearningProgress(100);
          // 최대 시청 시간을 전체 길이로 설정
          setMaxWatchedTime(duration);
          setWatchedEnough(true);
          return duration;
        }
        
        // 현재 진행률 계산
        const progress = Math.floor((newTime / duration) * 100);
        
        // 최대 시청 시간 업데이트
        if (newTime > maxWatchedTime) {
          setMaxWatchedTime(newTime);
          console.log('백그라운드 시청 시간 업데이트:', newTime);
          
          // 90% 이상 시청 여부 확인
          const progressRatio = newTime / duration;
          if (progressRatio >= 0.9 && !watchedEnough) {
            setWatchedEnough(true);
            console.log('90% 이상 시청 완료, 댓글 작성 가능');
          }
          
          // 시청 시간이 업데이트될 때마다 무조건 저장 (간단한 로직)
          console.log('백그라운드 시청 시간 업데이트 시 자동 저장:', newTime);
          updateLearningProgress(newTime);
        }
        
        return newTime;
      });
    }, 1000);
    
    setIsBackgroundPlaying(true);
  };

  /**
   * 백그라운드 재생 중지
   */
  const stopBackgroundPlayback = () => {
    if (backgroundTimerRef.current !== null) {
      BackgroundTimer.clearInterval(backgroundTimerRef.current);
      backgroundTimerRef.current = null;
    }
    
    setIsBackgroundPlaying(false);
  };

  /**
   * 컨트롤 토글
   */
  const toggleControls = () => {
    setShowControls(!showControls);
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>콘텐츠를 불러오는 중...</Text>
      </View>
    );
  }

  // 에러 표시
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableWithoutFeedback onPress={loadContent}>
          <View style={styles.retryButton}>
            <Text style={styles.retryText}>다시 시도</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  return (
    <View style={[
      styles.container,
      isFullscreen && styles.fullscreenContainer
    ]}>
      <StatusBar hidden={isFullscreen} />
      
      {/* 이어듣기 팝업 */}
      {showResumeDialog && (
        <View style={styles.resumeDialogOverlay}>
          <View style={styles.resumeDialog}>
            <Text style={styles.resumeDialogTitle}>이어듣기</Text>
            <Text style={styles.resumeDialogMessage}>
              이전에 {Math.floor(resumeTime / 60)}분 {Math.floor(resumeTime % 60)}초까지 시청했습니다.
              {'\n'}이어서 시청하시겠습니까?
            </Text>
            <View style={styles.resumeDialogButtons}>
              <TouchableOpacity 
                style={[styles.resumeDialogButton, styles.resumeDialogButtonSecondary]}
                onPress={handleStartFromBeginning}
              >
                <Text style={styles.resumeDialogButtonTextSecondary}>처음부터</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.resumeDialogButton, styles.resumeDialogButtonPrimary]}
                onPress={handleResume}
              >
                <Text style={styles.resumeDialogButtonTextPrimary}>이어듣기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
      
      <TouchableWithoutFeedback onPress={toggleControls}>
        <View style={[
          styles.videoContainer,
          isAudioMode && styles.audioModeContainer,
          isFullscreen && styles.fullscreenVideoContainer
        ]}>
          {/* 비디오 플레이어 */}
          {videoSource && (
            <>
              {isWeb ? (
                // 웹 환경에서는 HTML5 video 태그 사용
                <video
                  ref={videoRef}
                  src={videoSource.uri}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain'
                  }}
                  controls={false}
                  autoPlay={isPlaying}
                  preload="metadata"
                  crossOrigin="anonymous"
                  onLoadedData={handleLoad}
                  onTimeUpdate={handleProgress}
                  onEnded={handleEnd}
                  onError={handleError}
                  onWaiting={() => setIsBuffering(true)}
                  onCanPlay={() => setIsBuffering(false)}
                  onLoadStart={() => console.log('비디오 로딩 시작')}
                  onCanPlayThrough={() => console.log('비디오 재생 준비 완료')}
                />
              ) : (
                // 네이티브 환경에서는 React Native Video 사용
                <Video
                  ref={videoRef}
                  source={videoSource}
                  style={styles.video}
                  resizeMode={isAudioMode ? "contain" : "contain"}
                  paused={!isPlaying || isBackgroundPlaying}
                  onLoad={handleLoad}
                  onProgress={handleProgress}
                  onEnd={handleEnd}
                  onError={handleError}
                  onBuffer={handleBuffer}
                  playInBackground={true}
                  playWhenInactive={true}
                  ignoreSilentSwitch="ignore"
                  allowsExternalPlayback={true}
                  mixWithOthers="duck"
                  progressUpdateInterval={1000}
                />
              )}
            </>
          )}

          {/* 오디오 모드 표시 */}
          {isAudioMode && (
            <View style={styles.audioModeIndicator}>
              <Text style={styles.audioModeTitle}>
                {content?.title || '음성 모드'}
              </Text>
              <Text style={styles.audioModeSubtitle}>
                백그라운드 재생 중입니다.
              </Text>
            </View>
          )}

          {/* 버퍼링 인디케이터 */}
          {isBuffering && (
            <View style={styles.bufferingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.bufferingText}>버퍼링 중...</Text>
            </View>
          )}

          {/* 비디오 컨트롤 */}
          {showControls && (
            <VideoControls
              isPlaying={isPlaying}
              duration={duration}
              currentTime={currentTime}
              isAudioMode={isAudioMode}
              isCached={isCached}
              buffering={isBuffering}
              onPlayPause={togglePlayPause}
              onSeek={handleSeek}
              onModeToggle={toggleAudioMode}
              onForward={handleForward}
              onRewind={handleRewind}
              onSeekForward={seekForward}
              onSeekBackward={seekBackward}
              onFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              showCacheIndicator={!isWeb} // 웹에서는 캐시 표시 숨김
              isCompleted={isCompleted}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* 전체화면이 아닐 때만 콘텐츠 정보와 댓글 입력 표시 */}
      {!isFullscreen && (
        <ScrollView style={styles.scrollContainer}>
          {/* 콘텐츠 정보 */}
          {content && (
            <View style={styles.infoContainer}>
              <Text style={styles.title}>{content.title}</Text>
              <Text style={styles.category}>{content.category}</Text>
              
              {/* 액션 버튼들 */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleLikeToggle}
                >
                  <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={20} 
                    color={isLiked ? "#ff6b6b" : "#666"} 
                  />
                  <Text style={styles.actionButtonText}>
                    추천 {likeCount > 0 && `(${likeCount})`}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleFavoriteToggle}
                >
                  <Ionicons 
                    name={isFavorite ? "bookmark" : "bookmark-outline"} 
                    size={20} 
                    color={isFavorite ? "#ffa500" : "#666"} 
                  />
                  <Text style={styles.actionButtonText}>
                    즐겨찾기
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.actionButton}>
                  <Ionicons name="share-outline" size={20} color="#666" />
                  <Text style={styles.actionButtonText}>공유</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.description}>{content.description}</Text>
            </View>
          )}
          
          {/* 진행률 표시 - 컴팩트 버전 */}
          <View style={styles.progressContainerCompact}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>시청 시간</Text>
              <Text style={styles.progressPercentage}>{Math.floor(maxWatchedTime / 60)}분 {Math.floor(maxWatchedTime % 60)}초</Text>
              <View style={styles.progressBarCompact}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${Math.min((maxWatchedTime / (duration || 1)) * 100, 100)}%` },
                    (maxWatchedTime / (duration || 1)) >= 0.9 && styles.progressBarCompleted
                  ]} 
                />
              </View>
            </View>
            <Text style={styles.progressStatus}>
              {(maxWatchedTime / (duration || 1)) >= 0.9 
                ? '✅ 수료 완료' 
                : `${Math.floor(maxWatchedTime / 60)}분 ${Math.floor(maxWatchedTime % 60)}초 (90% 이상 필요)`
              }
            </Text>
            {maxWatchedTime > 0 && (maxWatchedTime / (duration || 1)) < 0.9 && (
              <Text style={styles.resumeInfo}>
                이어듣기: {Math.floor(currentTime / 60)}분 {Math.floor(currentTime % 60)}초부터
              </Text>
            )}
          </View>
          
          {/* 수료 상태 표시 */}
          {isCompleted && (
            <View style={styles.completedContainer}>
              <Text style={styles.completedText}>✓ 이미 수료한 콘텐츠입니다</Text>
            </View>
          )}
          
          {/* 댓글 목록 */}
          <CommentList key={commentRefreshKey} contentId={contentId} />
        </ScrollView>
      )}
      
      {/* 댓글 입력 (전체화면이 아니고 이미 수료하지 않았을 때만 표시) */}
      {!isFullscreen && !isCompleted && (
        <CommentInput
          isEnabled={watchedEnough}
          isSubmitting={isSubmittingComment}
          onSubmit={handleCommentSubmit}
          placeholder="학습 후기를 작성해주세요. (최소 100자)"
          minLength={100}
          maxLength={500}
        />
      )}
      
      {/* 수료 완료 후 재시청 안내 */}
      {!isFullscreen && isCompleted && (
        <View style={styles.replayContainer}>
          <Text style={styles.replayText}>
            ✓ 수료 완료! 이제 자유롭게 다시 시청하실 수 있습니다.
          </Text>
          <Text style={styles.replaySubText}>
            앞으로/뒤로 이동과 배속 기능을 사용할 수 있습니다.
          </Text>
        </View>
      )}
      
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  fullscreenContainer: {
    backgroundColor: '#000',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d9534f',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
  },
  videoContainer: {
    width: '100%',
    height: 200, // 높이 축소 (기존 aspectRatio 대신 고정 높이)
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenVideoContainer: {
    width: height,
    height: width,
    position: 'absolute',
    top: 0,
    left: -(height - width) / 2,
    transform: [{ rotate: '90deg' }],
  },
  audioModeContainer: {
    backgroundColor: '#1a1a1a',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  audioModeIndicator: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  audioModeTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  audioModeSubtitle: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  bufferingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bufferingText: {
    color: '#fff',
    marginTop: 10,
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    color: '#007bff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#666',
  },
  progressContainer: {
    padding: 16,
    paddingTop: 0,
  },
  progressContainerCompact: {
    padding: 12,
    paddingTop: 0,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  progressBarCompact: {
    flex: 1,
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007bff',
    borderRadius: 3,
  },
  progressStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  resumeInfo: {
    fontSize: 11,
    color: '#999',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff9800',
    borderRadius: 5,
  },
  progressBarCompleted: {
    backgroundColor: '#4caf50',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  completedContainer: {
    backgroundColor: '#e8f5e9',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  completedText: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  replayContainer: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  replayText: {
    fontSize: 16,
    color: '#1976d2',
    fontWeight: '600',
    textAlign: 'center',
  },
  replaySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  // 이어듣기 팝업 스타일
  resumeDialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  resumeDialog: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    minWidth: 300,
    maxWidth: 400,
    alignItems: 'center',
  },
  resumeDialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  resumeDialogMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  resumeDialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  resumeDialogButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  resumeDialogButtonPrimary: {
    backgroundColor: '#007bff',
  },
  resumeDialogButtonSecondary: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  resumeDialogButtonTextPrimary: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  resumeDialogButtonTextSecondary: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlayerScreen;