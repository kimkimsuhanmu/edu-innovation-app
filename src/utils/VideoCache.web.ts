// 웹 환경을 위한 VideoCache 모듈 구현
import { Platform } from 'react-native';

// 간단한 해시 함수 구현
const sha256 = async (str: string): Promise<string> => {
  let hash = 0;
  
  if (str.length === 0) {
    return 'empty';
  }
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  
  // 16진수 문자열로 변환하고 32자리로 패딩
  const hexHash = Math.abs(hash).toString(16).padStart(8, '0');
  
  // 32자리로 확장 (실제 SHA-256은 64자리)
  return hexHash.repeat(4);
};

/**
 * 캐시된 콘텐츠 정보 타입
 */
export interface CachedContent {
  url: string;
  localPath: string;
  type: 'video' | 'audio';
  size: number;
  lastAccessed: number;
  contentId: string;
}

/**
 * 비디오 캐싱 관리 클래스 (웹 환경용)
 * 
 * 웹 환경에서는 실제 캐싱 기능 대신 URL을 그대로 반환합니다.
 */
class VideoCache {
  // 캐시된 콘텐츠 정보 (웹에서는 localStorage 사용)
  private cachedContents: { [key: string]: CachedContent } = {};
  
  constructor() {
    // localStorage에서 캐시 정보 로드
    this.loadCacheInfo();
  }

  /**
   * 캐시 정보 로드
   */
  private loadCacheInfo() {
    try {
      if (typeof localStorage !== 'undefined') {
        const cacheInfo = localStorage.getItem('videoCacheInfo');
        if (cacheInfo) {
          this.cachedContents = JSON.parse(cacheInfo);
        }
      }
    } catch (error) {
      console.error('캐시 정보 로드 에러:', error);
      this.cachedContents = {};
    }
  }

  /**
   * 캐시 정보 저장
   */
  private saveCacheInfo() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('videoCacheInfo', JSON.stringify(this.cachedContents));
      }
    } catch (error) {
      console.error('캐시 정보 저장 에러:', error);
    }
  }

  /**
   * URL을 해시하여 파일명 생성
   */
  private async hashUrl(url: string): Promise<string> {
    return await sha256(url);
  }

  /**
   * 콘텐츠 캐싱 (웹에서는 URL을 그대로 반환)
   */
  async cacheContent(
    url: string,
    contentId: string,
    type: 'video' | 'audio',
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    try {
      // 웹에서는 캐싱하지 않고 URL을 그대로 반환
      this.cachedContents[url] = {
        url,
        localPath: url, // 웹에서는 원본 URL 사용
        type,
        size: 0,
        lastAccessed: Date.now(),
        contentId,
      };
      
      this.saveCacheInfo();
      
      // 진행 상황 콜백 호출 (100% 완료로 설정)
      if (progressCallback) {
        progressCallback(1);
      }
      
      return url;
    } catch (error) {
      console.error('콘텐츠 캐싱 에러:', error);
      throw error;
    }
  }

  /**
   * 캐시된 콘텐츠 가져오기 (웹에서는 URL을 그대로 반환)
   */
  async getCachedContent(
    url: string,
    contentId: string,
    type: 'video' | 'audio'
  ): Promise<string | null> {
    // 웹에서는 항상 원본 URL 반환
    return url;
  }

  /**
   * 특정 콘텐츠 캐시 삭제 (웹에서는 localStorage에서만 제거)
   */
  async clearContentCache(contentId: string): Promise<boolean> {
    try {
      // 해당 콘텐츠 ID의 캐시된 콘텐츠 찾기
      const contentUrls = Object.keys(this.cachedContents).filter(
        url => this.cachedContents[url].contentId === contentId
      );
      
      if (contentUrls.length === 0) {
        return false;
      }
      
      // localStorage에서 제거
      for (const url of contentUrls) {
        delete this.cachedContents[url];
      }
      
      this.saveCacheInfo();
      return true;
    } catch (error) {
      console.error('콘텐츠 캐시 삭제 에러:', error);
      return false;
    }
  }

  /**
   * 모든 캐시 삭제 (웹에서는 localStorage에서만 제거)
   */
  async clearAllCache(): Promise<boolean> {
    try {
      this.cachedContents = {};
      this.saveCacheInfo();
      return true;
    } catch (error) {
      console.error('모든 캐시 삭제 에러:', error);
      return false;
    }
  }

  /**
   * 캐시 상태 확인 (웹에서는 항상 캐시되지 않은 것으로 반환)
   */
  async getCacheStatus(contentId: string): Promise<{ isCached: boolean, size: number }> {
    return { isCached: false, size: 0 };
  }

  /**
   * 총 캐시 사용량 확인 (웹에서는 항상 0 반환)
   */
  async getTotalCacheSize(): Promise<number> {
    return 0;
  }

  /**
   * 최대 캐시 크기 설정 (웹에서는 아무 동작 안함)
   */
  setMaxCacheSize(sizeInBytes: number) {
    // 웹에서는 아무 동작 안함
  }
}

// 싱글톤 인스턴스 생성
export default new VideoCache();
