import { Platform } from 'react-native';

// 웹 환경이 아닐 때만 react-native-fs와 NetInfo 사용
let RNFS: any = null;
let NetInfo: any = null;

if (Platform.OS !== 'web') {
  try {
    RNFS = require('react-native-fs');
    NetInfo = require('@react-native-community/netinfo');
  } catch (error) {
    console.warn('Native modules not available:', error);
  }
}
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
 * 비디오 캐싱 관리 클래스
 * 
 * 비디오 및 오디오 파일을 로컬에 캐싱하고 관리하는 기능을 제공합니다.
 */
class VideoCache {
  // 캐시 디렉토리 경로
  private cacheDirVideo: string;
  private cacheDirAudio: string;
  
  // 캐시 정보를 저장할 파일 경로
  private cacheInfoPath: string;
  
  // 캐시된 콘텐츠 정보
  private cachedContents: { [key: string]: CachedContent } = {};
  
  // 최대 캐시 사이즈 (기본값: 2GB)
  private maxCacheSize: number = 2 * 1024 * 1024 * 1024;
  
  // 다운로드 작업 목록
  private downloadTasks: { [key: string]: RNFS.DownloadProgressCallbackResult } = {};

  constructor() {
    // 웹 환경이 아닐 때만 네이티브 캐시 디렉토리 설정
    if (Platform.OS !== 'web' && RNFS) {
      // 플랫폼별 캐시 디렉토리 설정
      const baseCacheDir = Platform.OS === 'ios' 
        ? RNFS.CachesDirectoryPath
        : RNFS.ExternalCachesDirectoryPath || RNFS.CachesDirectoryPath;
      
      this.cacheDirVideo = `${baseCacheDir}/video_cache`;
      this.cacheDirAudio = `${baseCacheDir}/audio_cache`;
      this.cacheInfoPath = `${baseCacheDir}/cache_info.json`;
      
      // 캐시 디렉토리 초기화
      this.initCacheDirectories();
      
      // 캐시 정보 로드
      this.loadCacheInfo();
    } else {
      // 웹 환경에서는 기본값 설정
      this.cacheDirVideo = '';
      this.cacheDirAudio = '';
      this.cacheInfoPath = '';
    }
  }

  /**
   * 캐시 디렉토리 초기화 (웹 환경이 아닐 때만)
   */
  private async initCacheDirectories() {
    // 웹 환경이거나 RNFS가 없으면 아무것도 하지 않음
    if (Platform.OS === 'web' || !RNFS) {
      return;
    }
    
    try {
      // 비디오 캐시 디렉토리 생성
      const videoDirExists = await RNFS.exists(this.cacheDirVideo);
      if (!videoDirExists) {
        await RNFS.mkdir(this.cacheDirVideo);
      }
      
      // 오디오 캐시 디렉토리 생성
      const audioDirExists = await RNFS.exists(this.cacheDirAudio);
      if (!audioDirExists) {
        await RNFS.mkdir(this.cacheDirAudio);
      }
    } catch (error) {
      console.error('캐시 디렉토리 초기화 에러:', error);
    }
  }

  /**
   * 캐시 정보 로드 (웹 환경이 아닐 때만)
   */
  private async loadCacheInfo() {
    // 웹 환경이거나 RNFS가 없으면 아무것도 하지 않음
    if (Platform.OS === 'web' || !RNFS) {
      return;
    }
    
    try {
      const exists = await RNFS.exists(this.cacheInfoPath);
      if (exists) {
        const content = await RNFS.readFile(this.cacheInfoPath, 'utf8');
        this.cachedContents = JSON.parse(content);
      }
    } catch (error) {
      console.error('캐시 정보 로드 에러:', error);
      this.cachedContents = {};
    }
  }

  /**
   * 캐시 정보 저장 (웹 환경이 아닐 때만)
   */
  private async saveCacheInfo() {
    // 웹 환경이거나 RNFS가 없으면 아무것도 하지 않음
    if (Platform.OS === 'web' || !RNFS) {
      return;
    }
    
    try {
      await RNFS.writeFile(
        this.cacheInfoPath,
        JSON.stringify(this.cachedContents),
        'utf8'
      );
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
   * 네트워크 연결 상태 확인 (웹 환경이 아닐 때만)
   */
  private async isNetworkConnected(): Promise<boolean> {
    // 웹 환경이거나 NetInfo가 없으면 항상 연결된 것으로 가정
    if (Platform.OS === 'web' || !NetInfo) {
      return true;
    }
    
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected === true;
  }

  /**
   * 캐시 크기 계산
   */
  private calculateCacheSize(): number {
    return Object.values(this.cachedContents).reduce((total, item) => total + item.size, 0);
  }

  /**
   * 캐시 정리 (LRU 알고리즘)
   * @param requiredSize 필요한 공간 크기
   */
  private async cleanupCache(requiredSize: number) {
    // 현재 캐시 크기 계산
    const currentSize = this.calculateCacheSize();
    
    // 캐시 크기가 최대 크기를 초과하지 않으면 정리하지 않음
    if (currentSize + requiredSize <= this.maxCacheSize) {
      return;
    }
    
    // 마지막 접근 시간 기준으로 정렬
    const sortedContents = Object.values(this.cachedContents).sort(
      (a, b) => a.lastAccessed - b.lastAccessed
    );
    
    // 필요한 공간이 확보될 때까지 오래된 파일부터 삭제
    let freedSpace = 0;
    const targetSize = currentSize + requiredSize - this.maxCacheSize;
    
    for (const content of sortedContents) {
      try {
        // 파일 삭제
        await RNFS.unlink(content.localPath);
        
        // 캐시 정보에서 제거
        delete this.cachedContents[content.url];
        
        // 확보한 공간 계산
        freedSpace += content.size;
        
        // 필요한 공간이 확보되면 종료
        if (freedSpace >= targetSize) {
          break;
        }
      } catch (error) {
        console.error('캐시 파일 삭제 에러:', error);
      }
    }
    
    // 캐시 정보 저장
    await this.saveCacheInfo();
  }

  /**
   * 콘텐츠 캐싱 (웹 환경이 아닐 때만)
   */
  async cacheContent(
    url: string,
    contentId: string,
    type: 'video' | 'audio',
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    // 웹 환경이거나 RNFS가 없으면 원본 URL 반환
    if (Platform.OS === 'web' || !RNFS) {
      if (progressCallback) {
        progressCallback(1); // 100% 완료로 표시
      }
      return url;
    }
    
    try {
      // 이미 캐싱된 콘텐츠인지 확인
      if (this.cachedContents[url]) {
        // 마지막 접근 시간 업데이트
        this.cachedContents[url].lastAccessed = Date.now();
        await this.saveCacheInfo();
        return this.cachedContents[url].localPath;
      }
      
      // 네트워크 연결 확인
      const isConnected = await this.isNetworkConnected();
      if (!isConnected) {
        throw new Error('네트워크 연결이 없습니다.');
      }
      
      // URL 해시하여 파일명 생성
      const hash = await this.hashUrl(url);
      const extension = url.split('.').pop() || (type === 'video' ? 'mp4' : 'mp3');
      const filename = `${hash}.${extension}`;
      
      // 캐시 디렉토리 선택
      const cacheDir = type === 'video' ? this.cacheDirVideo : this.cacheDirAudio;
      const localPath = `${cacheDir}/${filename}`;
      
      // 파일 크기 확인 (임시로 1MB로 설정)
      // 참고: react-native-fs에는 head 메서드가 없으므로 실제 구현에서는
      // 다른 방법으로 파일 크기를 확인해야 함
      const fileSize = 1024 * 1024; // 1MB
      
      // 캐시 정리
      await this.cleanupCache(fileSize);
      
      // 파일 다운로드
      const { jobId, promise } = RNFS.downloadFile({
        fromUrl: url,
        toFile: localPath,
        background: true,
        discretionary: true,
        progress: (res) => {
          this.downloadTasks[url] = res;
          if (progressCallback) {
            progressCallback(res.bytesWritten / res.contentLength);
          }
        },
      });
      
      const result = await promise;
      
      // 다운로드 성공 시 캐시 정보 업데이트
      if (result.statusCode === 200) {
        this.cachedContents[url] = {
          url,
          localPath,
          type,
          size: fileSize,
          lastAccessed: Date.now(),
          contentId,
        };
        
        await this.saveCacheInfo();
        delete this.downloadTasks[url];
        return localPath;
      } else {
        throw new Error(`다운로드 실패: ${result.statusCode}`);
      }
    } catch (error) {
      console.error('콘텐츠 캐싱 에러:', error);
      throw error;
    }
  }

  /**
   * 캐시된 콘텐츠 가져오기 (웹 환경이 아닐 때만)
   */
  async getCachedContent(
    url: string,
    contentId: string,
    type: 'video' | 'audio'
  ): Promise<string | null> {
    // 웹 환경이거나 RNFS가 없으면 항상 null 반환
    if (Platform.OS === 'web' || !RNFS) {
      return null;
    }
    
    try {
      // 캐시된 콘텐츠가 있는지 확인
      if (this.cachedContents[url]) {
        const cachedContent = this.cachedContents[url];
        
        // 파일이 실제로 존재하는지 확인
        const exists = await RNFS.exists(cachedContent.localPath);
        if (exists) {
          // 마지막 접근 시간 업데이트
          cachedContent.lastAccessed = Date.now();
          await this.saveCacheInfo();
          return cachedContent.localPath;
        } else {
          // 파일이 존재하지 않으면 캐시 정보에서 제거
          delete this.cachedContents[url];
          await this.saveCacheInfo();
        }
      }
      
      // 캐시된 콘텐츠가 없으면 null 반환
      return null;
    } catch (error) {
      console.error('캐시된 콘텐츠 가져오기 에러:', error);
      return null;
    }
  }

  /**
   * 특정 콘텐츠 캐시 삭제
   * @param contentId 콘텐츠 ID
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
      
      // 찾은 모든 콘텐츠 삭제
      for (const url of contentUrls) {
        const cachedContent = this.cachedContents[url];
        
        // 파일이 존재하는지 확인
        const exists = await RNFS.exists(cachedContent.localPath);
        if (exists) {
          // 파일 삭제
          await RNFS.unlink(cachedContent.localPath);
        }
        
        // 캐시 정보에서 제거
        delete this.cachedContents[url];
      }
      
      // 캐시 정보 저장
      await this.saveCacheInfo();
      return true;
    } catch (error) {
      console.error('콘텐츠 캐시 삭제 에러:', error);
      return false;
    }
  }

  /**
   * 모든 캐시 삭제
   */
  async clearAllCache(): Promise<boolean> {
    try {
      // 모든 캐시된 콘텐츠 삭제
      for (const url in this.cachedContents) {
        const cachedContent = this.cachedContents[url];
        
        // 파일이 존재하는지 확인
        const exists = await RNFS.exists(cachedContent.localPath);
        if (exists) {
          // 파일 삭제
          await RNFS.unlink(cachedContent.localPath);
        }
      }
      
      // 캐시 정보 초기화
      this.cachedContents = {};
      await this.saveCacheInfo();
      return true;
    } catch (error) {
      console.error('모든 캐시 삭제 에러:', error);
      return false;
    }
  }

  /**
   * 캐시 상태 확인 (웹 환경이 아닐 때만)
   */
  async getCacheStatus(contentId: string): Promise<{ isCached: boolean, size: number }> {
    // 웹 환경이거나 RNFS가 없으면 항상 캐시되지 않은 것으로 반환
    if (Platform.OS === 'web' || !RNFS) {
      return { isCached: false, size: 0 };
    }
    
    try {
      // 해당 콘텐츠 ID의 캐시된 콘텐츠 찾기
      const cachedContent = Object.values(this.cachedContents).find(
        content => content.contentId === contentId
      );
      
      if (!cachedContent) {
        return { isCached: false, size: 0 };
      }
      
      // 파일이 실제로 존재하는지 확인
      const exists = await RNFS.exists(cachedContent.localPath);
      if (!exists) {
        // 파일이 존재하지 않으면 캐시 정보에서 제거
        delete this.cachedContents[cachedContent.url];
        await this.saveCacheInfo();
        return { isCached: false, size: 0 };
      }
      
      return { isCached: true, size: cachedContent.size };
    } catch (error) {
      console.error('캐시 상태 확인 에러:', error);
      return { isCached: false, size: 0 };
    }
  }

  /**
   * 총 캐시 사용량 확인
   */
  async getTotalCacheSize(): Promise<number> {
    return this.calculateCacheSize();
  }

  /**
   * 최대 캐시 크기 설정
   * @param sizeInBytes 최대 캐시 크기 (바이트 단위)
   */
  setMaxCacheSize(sizeInBytes: number) {
    this.maxCacheSize = sizeInBytes;
  }
}

// 싱글톤 인스턴스 생성
export default new VideoCache();
