import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

/**
 * VideoControls 컴포넌트 props 타입 정의
 */
interface VideoControlsProps {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  isAudioMode: boolean;
  isCached: boolean;
  buffering: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onModeToggle: () => void;
  onForward: () => void;
  onRewind: () => void;
  onSeekForward: () => void; // 5초 앞으로 이동
  onSeekBackward: () => void; // 5초 뒤로 이동
  onFullscreen: () => void;
  isFullscreen: boolean;
  showCacheIndicator?: boolean; // 웹에서 캐시 표시를 숨기기 위한 옵션
  isCompleted?: boolean; // 수료 완료 여부
}

/**
 * 비디오 컨트롤 컴포넌트
 * 
 * 재생/일시정지, 탐색, 모드 전환 등의 컨트롤을 제공합니다.
 */
const VideoControls: React.FC<VideoControlsProps> = ({
  isPlaying,
  duration,
  currentTime,
  isAudioMode,
  isCached,
  buffering,
  onPlayPause,
  onSeek,
  onModeToggle,
  onForward,
  onRewind,
  onSeekForward,
  onSeekBackward,
  onFullscreen,
  isFullscreen,
  showCacheIndicator = true, // 기본값은 true
  isCompleted = false
}) => {
  // 상태 관리
  const [opacity] = useState(1);
  const [isVisible, setIsVisible] = useState(true);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  /**
   * 컨트롤 숨기기 타이머
   */
  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>;
    
    if (isPlaying && isVisible && !isSeeking) {
      hideTimeout = setTimeout(() => {
        fadeOut();
      }, 3000);
    }
    
    return () => {
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [isPlaying, isVisible, isSeeking]);

  /**
   * 컨트롤 숨기기
   */
  const fadeOut = () => {
    // 간단한 구현으로 대체
    setIsVisible(false);
  };

  /**
   * 컨트롤 표시
   */
  const fadeIn = () => {
    setIsVisible(true);
  };

  /**
   * 컨트롤 토글
   */
  const toggleControls = () => {
    if (isVisible) {
      fadeOut();
    } else {
      fadeIn();
    }
  };

  /**
   * 시간 포맷팅 (초 -> 분:초)
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /**
   * 시크 시작 핸들러
   */
  const handleSlidingStart = () => {
    setIsSeeking(true);
  };

  /**
   * 시크 중 핸들러
   */
  const handleValueChange = (value: number) => {
    setSeekValue(value);
  };

  /**
   * 시크 완료 핸들러
   */
  const handleSlidingComplete = (value: number) => {
    onSeek(value * duration);
    setIsSeeking(false);
  };

  return (
    <View 
      style={[
        styles.container, 
        { opacity: opacity as any },
        isAudioMode && styles.audioModeContainer
      ]}
    >
      {/* 상단 컨트롤 */}
      <View style={styles.topControls}>
        <View style={styles.leftControls}>
          <TouchableOpacity
            style={styles.modeButton}
            onPress={onModeToggle}
          >
            <Ionicons
              name={isAudioMode ? 'videocam' : 'headset'}
              size={24}
              color="#fff"
            />
            <Text style={styles.modeText}>
              {isAudioMode ? '영상 모드' : '음성 모드'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.rightControls}>
          {isCached && showCacheIndicator && (
            <View style={styles.cachedIndicator}>
              <Ionicons name="save-outline" size={16} color="#fff" />
              <Text style={styles.cachedText}>캐시됨</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={styles.fullscreenButton}
            onPress={onFullscreen}
          >
            <Ionicons
              name={isFullscreen ? 'contract' : 'expand'}
              size={24}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 중앙 컨트롤 */}
      <View style={styles.centerControls}>
        <TouchableOpacity
          style={[styles.controlButton, !isCompleted && styles.disabledButton]}
          onPress={isCompleted ? onRewind : undefined}
          disabled={!isCompleted}
        >
          <Ionicons name="play-back" size={32} color={isCompleted ? "#fff" : "#666"} />
        </TouchableOpacity>

        {/* 5초 뒤로 이동 버튼 */}
        <TouchableOpacity
          style={[styles.seekButton, !isCompleted && styles.disabledButton]}
          onPress={isCompleted ? onSeekBackward : undefined}
          disabled={!isCompleted}
        >
          <Ionicons name="play-skip-back" size={24} color="#fff" />
          <Text style={styles.seekText}>5초</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playPauseButton}
          onPress={onPlayPause}
        >
          {buffering ? (
            <Ionicons name="sync" size={40} color="#fff" />
          ) : (
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={40}
              color="#fff"
            />
          )}
        </TouchableOpacity>

        {/* 5초 앞으로 이동 버튼 */}
        <TouchableOpacity
          style={[styles.seekButton, !isCompleted && styles.disabledButton]}
          onPress={isCompleted ? onSeekForward : undefined}
          disabled={!isCompleted}
        >
          <Ionicons name="play-skip-forward" size={24} color="#fff" />
          <Text style={styles.seekText}>5초</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, !isCompleted && styles.disabledButton]}
          onPress={isCompleted ? onForward : undefined}
          disabled={!isCompleted}
        >
          <Ionicons name="play-forward" size={32} color={isCompleted ? "#fff" : "#666"} />
        </TouchableOpacity>
      </View>

      {/* 하단 컨트롤 */}
      <View style={styles.bottomControls}>
        <Text style={styles.timeText}>
          {formatTime(isSeeking ? seekValue * duration : currentTime)}
        </Text>
        
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={isSeeking ? seekValue : (duration > 0 ? currentTime / duration : 0)}
          minimumTrackTintColor="#007bff"
          maximumTrackTintColor="rgba(255, 255, 255, 0.5)"
          thumbTintColor={isCompleted ? "#007bff" : "#999999"}
          disabled={!isCompleted}
          onSlidingStart={isCompleted ? handleSlidingStart : undefined}
          onValueChange={isCompleted ? handleValueChange : undefined}
          onSlidingComplete={isCompleted ? handleSlidingComplete : undefined}
        />
        
        <Text style={styles.timeText}>
          {formatTime(duration)}
        </Text>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
    padding: 16,
  },
  audioModeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  modeText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  cachedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 123, 255, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  cachedText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  fullscreenButton: {
    padding: 8,
  },
  centerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    padding: 16,
  },
  seekButton: {
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    marginHorizontal: 8,
  },
  seekText: {
    color: '#fff',
    fontSize: 10,
    marginTop: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  playPauseButton: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    marginHorizontal: 24,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 24 : 0,
  },
  timeText: {
    color: '#fff',
    fontSize: 12,
    width: 40,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
});

export default VideoControls;
