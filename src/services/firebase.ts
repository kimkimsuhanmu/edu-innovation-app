/**
 * Firebase 서비스 모듈
 * 
 * 이 파일은 Firebase와의 모든 상호작용을 중앙 집중화하기 위한 것입니다.
 * Firebase 서비스(Authentication, Firestore, Storage)를 초기화하고 
 * 관련 기능을 제공합니다.
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  setDoc,
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc,
  query, 
  where,
  orderBy,
  limit,
  increment,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

/**
 * Firebase 설정 객체
 * 
 * 아래의 값들은 Firebase 콘솔에서 프로젝트 설정을 통해 얻을 수 있습니다.
 * 1. Firebase 콘솔(https://console.firebase.google.com/)에 로그인합니다.
 * 2. 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
 * 3. 프로젝트 설정(⚙️ 아이콘) > 프로젝트 설정으로 이동합니다.
 * 4. '일반' 탭에서 아래로 스크롤하여 '내 앱' 섹션을 찾습니다.
 * 5. 웹 앱(</> 아이콘)을 클릭하여 새 앱을 등록합니다.
 * 6. 앱 등록 후 표시되는 firebaseConfig 객체의 값들을 아래에 붙여넣습니다.
 * 
 * 보안 주의사항:
 * - 실제 프로덕션 환경에서는 이 값들을 환경 변수로 관리하는 것이 좋습니다.
 * - React Native에서는 react-native-dotenv 또는 react-native-config 패키지를 
 *   사용하여 .env 파일에서 이 값들을 로드할 수 있습니다.
 */
const firebaseConfig = {
  apiKey: "AIzaSyDbYSjoTmHkB4s--bhb0nZtSHAi7X7DJqI",
  authDomain: "gucedu-d5a97.firebaseapp.com",
  projectId: "gucedu-d5a97",
  storageBucket: "gucedu-d5a97.appspot.com",
  messagingSenderId: "835725467623",
  appId: "1:835725467623:web:a309f19e8eff41bd31e742",
  measurementId: "G-X6KC7F3Y49"
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

// 사용자 정보 타입 정의
export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  employeeId: string;
  role?: 'admin' | 'user';
  photoURL?: string;
}

// 콘텐츠 타입 정의
export interface Content {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: number; // 초 단위
  videoUrl: string;
  audioUrl: string;
  thumbnailUrl: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  viewCount: number;
  likeCount?: number; // 추천 수 추가
  favoriteCount?: number; // 즐겨찾기 수 추가
}

// 학습 기록 타입 정의
export interface LearningRecord {
  id?: string;
  userId: string;
  contentId: string;
  watchedTime: number; // 시청 시간 (초) - progress 대신 사용
  progress?: number; // 호환성을 위해 유지 (deprecated)
  completed: boolean;
  completionDate?: Timestamp;
  lastAccessDate: Timestamp;
  comment?: string;
  category?: string; // 콘텐츠 카테고리 추가
}

// 추천 타입 정의
export interface Like {
  id?: string;
  userId: string;
  contentId: string;
  createdAt: Timestamp;
}

// 즐겨찾기 타입 정의
export interface Favorite {
  id?: string;
  userId: string;
  contentId: string;
  createdAt: Timestamp;
}

/**
 * 인증 관련 함수
 */
export const authService = {
  /**
   * 현재 로그인한 사용자 가져오기
   */
  getCurrentUser: (): User | null => {
    return auth.currentUser;
  },

  /**
   * 사용자 로그인 (이메일 또는 사번으로 로그인)
   * @param emailOrEmployeeId 이메일 또는 사번
   * @param password 비밀번호
   */
  login: async (emailOrEmployeeId: string, password: string) => {
    try {
      console.log('🔐 로그인 시도:', { emailOrEmployeeId, passwordLength: password.length });
      
      // 먼저 이메일로 로그인 시도
      let userCredential;
      try {
        console.log('📧 이메일로 로그인 시도...');
        userCredential = await signInWithEmailAndPassword(auth, emailOrEmployeeId, password);
        console.log('✅ 이메일 로그인 성공');
      } catch (emailError: any) {
        console.log('❌ 이메일 로그인 실패:', emailError.code, emailError.message);
        
        // 이메일 로그인 실패 시 사번으로 로그인 시도
        if (emailError.code === 'auth/invalid-email' || emailError.code === 'auth/user-not-found' || emailError.code === 'auth/invalid-credential') {
          console.log('🔍 사번으로 로그인 시도...');
          
          // 사번으로 사용자 찾기
          const employeeQuery = query(
            collection(firestore, 'user'), 
            where('employeeId', '==', emailOrEmployeeId)
          );
          const employeeSnapshot = await getDocs(employeeQuery);
          
          console.log('🔍 사번 검색 결과:', { 
            queryValue: emailOrEmployeeId, 
            foundDocs: employeeSnapshot.docs.length,
            docs: employeeSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
          });
          
          if (employeeSnapshot.empty) {
            console.log('❌ 사번으로 사용자 찾기 실패');
            return {
              success: false,
              error: '존재하지 않는 이메일 또는 사번입니다.'
            };
          }
          
          console.log('✅ 사번으로 사용자 찾기 성공');
          // 사번으로 찾은 사용자의 이메일로 로그인 시도
          const userData = employeeSnapshot.docs[0].data();
          console.log('📧 찾은 사용자 이메일로 로그인 시도:', userData.email);
          
          if (!userData.email) {
            console.log('❌ 사용자 데이터에 이메일이 없음');
            return {
              success: false,
              error: '사용자 정보에 이메일이 없습니다.'
            };
          }
          
          userCredential = await signInWithEmailAndPassword(auth, userData.email, password);
          console.log('✅ 사번 로그인 성공');
        } else {
          throw emailError;
        }
      }
      
      // 사용자 프로필 정보 가져오기
      console.log('👤 사용자 프로필 정보 가져오기...');
      const userDoc = await getDoc(doc(firestore, 'user', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('✅ 사용자 프로필 정보:', { 
          email: userData.email, 
          status: userData.status, 
          role: userData.role 
        });
        
        // 계정이 'pending' 상태인지 확인
        if (userData.status === 'pending') {
          console.log('⏳ 승인 대기 중인 계정');
          return {
            success: false,
            error: '관리자 승인 대기 중입니다. 승인 후 로그인이 가능합니다.'
          };
        }
        
        // 계정이 'inactive' 상태인지 확인
        if (userData.status === 'inactive') {
          console.log('🚫 비활성화된 계정');
          return {
            success: false,
            error: '비활성화된 계정입니다. 관리자에게 문의하세요.'
          };
        }
        
        console.log('✅ 로그인 완료');
        return { 
          success: true, 
          user: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            ...userData
          }
        };
      } else {
        console.log('❌ 사용자 프로필 정보 없음');
        throw new Error('사용자 프로필 정보가 없습니다.');
      }
    } catch (error: any) {
      console.error('로그인 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 사용자 회원가입
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호
   * @param employeeId 사원번호
   * @param name 사용자 이름
   */
  register: async (email: string, password: string, employeeId: string, name: string) => {
    try {
      // 사원번호 중복 확인 (Firebase Auth는 이메일 중복을 자동으로 확인함)
      try {
        const employeeQuery = query(
          collection(firestore, 'user'), 
          where('employeeId', '==', employeeId)
        );
        const employeeSnapshot = await getDocs(employeeQuery);
        
        if (!employeeSnapshot.empty) {
          return { success: false, error: '이미 등록된 사원번호입니다.' };
        }
      } catch (queryError) {
        console.warn('사원번호 중복 확인 쿼리 실패:', queryError);
        // 권한 문제로 쿼리가 실패하는 경우, 회원가입을 계속 진행
        // 관리자 페이지에서 중복을 확인할 수 있음
      }
      
      // 사용자 계정 생성
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // 사용자 표시 이름 설정
      await updateProfile(userCredential.user, { displayName: name });
      
      // Firestore에 사용자 정보 저장 (상태를 'pending'으로 설정)
      await setDoc(doc(firestore, 'user', userCredential.user.uid), {
        email,
        displayName: name,
        employeeId,
        role: 'user',
        status: 'pending', // 승인 대기 상태로 설정
        createdAt: Timestamp.now()
      });
      
      // 회원가입 후 즉시 로그아웃 (승인 대기 상태이므로)
      await signOut(auth);
      
      return { 
        success: true, 
        user: {
          uid: userCredential.user.uid,
          email,
          displayName: name,
          employeeId,
          role: 'user',
          status: 'pending'
        }
      };
    } catch (error: any) {
      console.error('회원가입 에러:', error);
      
      // Firebase Auth 오류를 사용자 친화적인 메시지로 변환
      let errorMessage = error.message;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 등록된 이메일입니다.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '유효하지 않은 이메일 형식입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },

  /**
   * 로그아웃
   */
  logout: async () => {
    try {
      await signOut(auth);
    return { success: true };
    } catch (error: any) {
      console.error('로그아웃 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 비밀번호 재설정 이메일 전송
   * @param email 사용자 이메일
   */
  resetPassword: async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    return { success: true };
    } catch (error: any) {
      console.error('비밀번호 재설정 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 인증 상태 변경 리스너 등록
   * @param callback 인증 상태 변경 시 호출될 콜백 함수
   */
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};

/**
 * 콘텐츠 관련 함수
 */
export const contentService = {
  /**
   * Storage 파일 경로를 Download URL로 변환
   * @param filePath Storage 파일 경로
   */
  getDownloadUrl: async (filePath: string): Promise<string | null> => {
    try {
      if (!filePath) return null;
      
      // 이미 완전한 URL인 경우 그대로 반환
      if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        return filePath;
      }
      
      // Storage 참조 생성
      const fileRef = ref(storage, filePath);
      
      // Download URL 생성
      const downloadUrl = await getDownloadURL(fileRef);
      return downloadUrl;
    } catch (error: any) {
      console.error('Download URL 생성 에러:', error);
      return null;
    }
  },

  /**
   * 콘텐츠의 미디어 URL들을 Download URL로 변환
   * @param content 콘텐츠 객체
   */
  processContentUrls: async (content: any): Promise<any> => {
    try {
      const processedContent = { ...content };
      
      // 비디오 URL 처리
      if (content.videoUrl) {
        const videoDownloadUrl = await contentService.getDownloadUrl(content.videoUrl);
        processedContent.videoUrl = videoDownloadUrl || content.videoUrl;
      }
      
      // 오디오 URL 처리
      if (content.audioUrl) {
        const audioDownloadUrl = await contentService.getDownloadUrl(content.audioUrl);
        processedContent.audioUrl = audioDownloadUrl || content.audioUrl;
      }
      
      // 썸네일 URL 처리
      if (content.thumbnailUrl) {
        const thumbnailDownloadUrl = await contentService.getDownloadUrl(content.thumbnailUrl);
        processedContent.thumbnailUrl = thumbnailDownloadUrl || content.thumbnailUrl;
      }
      
      return processedContent;
    } catch (error: any) {
      console.error('콘텐츠 URL 처리 에러:', error);
      return content; // 오류 시 원본 반환
    }
  },
  /**
   * 최신 콘텐츠 목록 가져오기
   * @param limit 가져올 콘텐츠 수
   */
  getLatestContents: async (limitCount = 10) => {
    try {
      const contentQuery = query(
        collection(firestore, 'contents'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const contentSnapshot = await getDocs(contentQuery);
      const contents: Content[] = [];
      
      // 각 콘텐츠의 URL을 처리
      for (const doc of contentSnapshot.docs) {
        const contentData = {
          id: doc.id,
          ...doc.data()
        } as Content;
        
        const processedContent = await contentService.processContentUrls(contentData);
        contents.push(processedContent);
      }
      
      return { success: true, contents };
    } catch (error: any) {
      console.error('최신 콘텐츠 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 인기 콘텐츠 목록 가져오기
   * @param limit 가져올 콘텐츠 수
   */
  getPopularContents: async (limitCount = 10) => {
    try {
      const contentQuery = query(
        collection(firestore, 'contents'),
        orderBy('viewCount', 'desc'),
        limit(limitCount)
      );
      
      const contentSnapshot = await getDocs(contentQuery);
      const contents: Content[] = [];
      
      // 각 콘텐츠의 URL을 처리
      for (const doc of contentSnapshot.docs) {
        const contentData = {
          id: doc.id,
          ...doc.data()
        } as Content;
        
        const processedContent = await contentService.processContentUrls(contentData);
        contents.push(processedContent);
      }
      
      return { success: true, contents };
    } catch (error: any) {
      console.error('인기 콘텐츠 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 카테고리 목록 가져오기
   */
  getCategories: async () => {
    try {
      const contentsQuery = query(collection(firestore, 'contents'));
      const contentsSnapshot = await getDocs(contentsQuery);
      
      const categories = new Set<string>();
      contentsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.category) {
          categories.add(data.category);
        }
      });
      
      return { 
        success: true, 
        categories: Array.from(categories).sort() 
      };
    } catch (error: any) {
      console.error('카테고리 목록 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 추천수 기준으로 콘텐츠 가져오기
   * @param limitCount 가져올 콘텐츠 수
   */
  getContentsByLikeCount: async (limitCount = 10) => {
    try {
      // 인덱스 문제 해결을 위해 orderBy 제거 후 클라이언트에서 정렬
      const contentQuery = query(
        collection(firestore, 'contents'),
        limit(limitCount * 2) // 더 많이 가져와서 클라이언트에서 정렬
      );
      
      const contentSnapshot = await getDocs(contentQuery);
      const contents: Content[] = [];
      
      // 각 콘텐츠의 URL을 처리
      for (const doc of contentSnapshot.docs) {
        const contentData = {
          id: doc.id,
          ...doc.data()
        } as Content;
        
        const processedContent = await contentService.processContentUrls(contentData);
        contents.push(processedContent);
      }
      
      // 클라이언트에서 추천수 기준으로 내림차순 정렬하고 limit 적용
      const sortedContents = contents
        .sort((a, b) => {
          const aCount = a.likeCount || 0;
          const bCount = b.likeCount || 0;
          return bCount - aCount; // 내림차순 정렬
        })
        .slice(0, limitCount);
      
      return { success: true, contents: sortedContents };
    } catch (error: any) {
      console.error('추천수 순 콘텐츠 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 즐겨찾기 수 기준으로 콘텐츠 가져오기
   * @param limitCount 가져올 콘텐츠 수
   */
  getContentsByFavoriteCount: async (limitCount = 10) => {
    try {
      // 인덱스 문제 해결을 위해 orderBy 제거 후 클라이언트에서 정렬
      const contentQuery = query(
        collection(firestore, 'contents'),
        limit(limitCount * 2) // 더 많이 가져와서 클라이언트에서 정렬
      );
      
      const contentSnapshot = await getDocs(contentQuery);
      const contents: Content[] = [];
      
      // 각 콘텐츠의 URL을 처리
      for (const doc of contentSnapshot.docs) {
        const contentData = {
          id: doc.id,
          ...doc.data()
        } as Content;
        
        const processedContent = await contentService.processContentUrls(contentData);
        contents.push(processedContent);
      }
      
      // 클라이언트에서 즐겨찾기 수 기준으로 내림차순 정렬하고 limit 적용
      const sortedContents = contents
        .sort((a, b) => {
          const aCount = a.favoriteCount || 0;
          const bCount = b.favoriteCount || 0;
          return bCount - aCount; // 내림차순 정렬
        })
        .slice(0, limitCount);
      
      return { success: true, contents: sortedContents };
    } catch (error: any) {
      console.error('즐겨찾기 순 콘텐츠 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 카테고리별 콘텐츠 가져오기
   * @param category 카테고리 이름
   * @param limit 가져올 콘텐츠 수
   */
  getContentsByCategory: async (category: string, limitCount = 10) => {
    try {
      // 인덱스 문제 해결을 위해 orderBy 제거 후 클라이언트에서 정렬
      const contentQuery = query(
        collection(firestore, 'contents'),
        where('category', '==', category),
        limit(limitCount * 2) // 더 많이 가져와서 클라이언트에서 정렬
      );
      
      const contentSnapshot = await getDocs(contentQuery);
      const contents: Content[] = [];
      
      // 각 콘텐츠의 URL을 처리
      for (const doc of contentSnapshot.docs) {
        const contentData = {
          id: doc.id,
          ...doc.data()
        } as Content;
        
        const processedContent = await contentService.processContentUrls(contentData);
        contents.push(processedContent);
      }
      
      // 클라이언트에서 최신순으로 정렬하고 limit 적용
      const sortedContents = contents
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() || new Date(0);
          const bTime = b.createdAt?.toDate?.() || new Date(0);
          return bTime.getTime() - aTime.getTime();
        })
        .slice(0, limitCount);
      
      return { success: true, contents: sortedContents };
    } catch (error: any) {
      console.error('카테고리별 콘텐츠 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 콘텐츠 상세 정보 가져오기
   * @param contentId 콘텐츠 ID
   */
  getContentDetails: async (contentId: string) => {
    try {
      const contentDoc = await getDoc(doc(firestore, 'contents', contentId));
      
      if (contentDoc.exists()) {
        const contentData = {
          id: contentDoc.id,
          ...contentDoc.data()
        } as Content;
        
        // Download URL 생성
        const processedContent = await contentService.processContentUrls(contentData);
        
    return {
          success: true,
          content: processedContent
        };
      } else {
        throw new Error('콘텐츠를 찾을 수 없습니다.');
      }
    } catch (error: any) {
      console.error('콘텐츠 상세 정보 가져오기 에러:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 모든 콘텐츠의 통계 초기화/업데이트
   */
  initializeContentStats: async () => {
    try {
      const contentsQuery = query(collection(firestore, 'contents'));
      const contentsSnapshot = await getDocs(contentsQuery);
      
      const updatePromises = contentsSnapshot.docs.map(async (docSnapshot) => {
        const contentId = docSnapshot.id;
        
        // 즐겨찾기 수 계산
        const favoriteQuery = query(
          collection(firestore, 'favorites'),
          where('contentId', '==', contentId)
        );
        const favoriteSnapshot = await getDocs(favoriteQuery);
        const favoriteCount = favoriteSnapshot.size;
        
        // 추천 수 계산
        const likeQuery = query(
          collection(firestore, 'likes'),
          where('contentId', '==', contentId)
        );
        const likeSnapshot = await getDocs(likeQuery);
        const likeCount = likeSnapshot.size;
        
        // 콘텐츠 업데이트
        await updateDoc(doc(firestore, 'contents', contentId), {
          favoriteCount: favoriteCount,
          likeCount: likeCount
        });
        
        return { contentId, favoriteCount, likeCount };
      });
      
      const results = await Promise.all(updatePromises);
      
      return { 
        success: true, 
        updatedCount: results.length,
        results 
      };
    } catch (error: any) {
      console.error('콘텐츠 통계 초기화 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 콘텐츠 조회수 증가
   * @param contentId 콘텐츠 ID
   */
  incrementViewCount: async (contentId: string) => {
    try {
      const contentRef = doc(firestore, 'contents', contentId);
      await updateDoc(contentRef, {
        viewCount: increment(1)
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('조회수 증가 에러:', error);
    return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 콘텐츠 검색
   * @param keyword 검색 키워드
   */
  searchContents: async (keyword: string) => {
    try {
      // 모든 콘텐츠를 가져와서 클라이언트에서 부분 문자열 검색 수행
      // 대소문자 구분 없이 검색하고, 제목과 설명에서 검색
      const contentQuery = query(
        collection(firestore, 'contents')
      );
      
      const contentSnapshot = await getDocs(contentQuery);
      const contents: Content[] = [];
      
      // 검색 키워드를 소문자로 변환
      const searchKeyword = keyword.toLowerCase().trim();
      
      // 각 콘텐츠의 URL을 처리하고 검색 조건 확인
      for (const doc of contentSnapshot.docs) {
        const contentData = {
          id: doc.id,
          ...doc.data()
        } as Content;
        
        // 제목과 설명에서 부분 문자열 검색 (대소문자 구분 없음)
        const titleMatch = contentData.title?.toLowerCase().includes(searchKeyword) || false;
        const descriptionMatch = contentData.description?.toLowerCase().includes(searchKeyword) || false;
        
        if (titleMatch || descriptionMatch) {
          const processedContent = await contentService.processContentUrls(contentData);
          contents.push(processedContent);
        }
      }
      
      // 검색 결과를 제목 매치 우선으로 정렬
      const sortedContents = contents.sort((a, b) => {
        const aTitleMatch = a.title?.toLowerCase().includes(searchKeyword) || false;
        const bTitleMatch = b.title?.toLowerCase().includes(searchKeyword) || false;
        
        if (aTitleMatch && !bTitleMatch) return -1;
        if (!aTitleMatch && bTitleMatch) return 1;
        return 0;
      });
      
      return { success: true, contents: sortedContents };
    } catch (error: any) {
      console.error('콘텐츠 검색 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 사용자별 추천 콘텐츠 가져오기
   * @param userId 사용자 ID
   * @param limit 가져올 콘텐츠 수
   */
  getRecommendedContents: async (userId: string, limitCount = 10) => {
    try {
      // 사용자의 학습 기록 가져오기
      const learningQuery = query(
        collection(firestore, 'learningRecords'),
        where('userId', '==', userId),
        where('completed', '==', true)
      );
      
      const learningSnapshot = await getDocs(learningQuery);
      const completedCategories: string[] = [];
      
      // 완료한 콘텐츠의 카테고리 수집
      for (const doc of learningSnapshot.docs) {
        const record = doc.data();
        if (record.category) {
          completedCategories.push(record.category);
        }
      }
      
      // 추천 로직: 완료한 카테고리와 다른 카테고리의 콘텐츠 우선 추천
      const contentQuery = query(
        collection(firestore, 'contents'),
        orderBy('viewCount', 'desc'),
        limit(limitCount * 2) // 더 많이 가져와서 필터링
      );
      
      const contentSnapshot = await getDocs(contentQuery);
      const contents: Content[] = [];
      
      // 각 콘텐츠의 URL을 처리
      for (const doc of contentSnapshot.docs) {
        const contentData = {
          id: doc.id,
          ...doc.data()
        } as Content;
        
        const processedContent = await contentService.processContentUrls(contentData);
        contents.push(processedContent);
      }
      
      // 추천 순서 정렬: 새로운 카테고리 우선, 그 다음 조회수 순
      contents.sort((a, b) => {
        const aIsNewCategory = !completedCategories.includes(a.category);
        const bIsNewCategory = !completedCategories.includes(b.category);
        
        if (aIsNewCategory && !bIsNewCategory) return -1;
        if (!aIsNewCategory && bIsNewCategory) return 1;
        
        return (b.viewCount || 0) - (a.viewCount || 0);
      });
      
      return { 
        success: true, 
        contents: contents.slice(0, limitCount) 
      };
    } catch (error: any) {
      console.error('추천 콘텐츠 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * 카테고리 관련 함수
 */
export const categoryService = {
  /**
   * 모든 카테고리 가져오기
   */
  getAllCategories: async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, 'categories'));
      const categories: any[] = [];
      
      querySnapshot.forEach((doc) => {
        categories.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, categories };
    } catch (error: any) {
      console.error('카테고리 로딩 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * 학습 기록 관련 함수
 */
export const learningService = {
  /**
   * 학습 시청 시간 가져오기
   * @param userId 사용자 ID
   * @param contentId 콘텐츠 ID
   */
  getLearningProgress: async (userId: string, contentId: string) => {
    try {
      console.log('학습 시청 시간 조회 시작:', { userId, contentId });
      
      const recordQuery = query(
        collection(firestore, 'learningRecords'),
        where('userId', '==', userId),
        where('contentId', '==', contentId)
      );
      
      const recordSnapshot = await getDocs(recordQuery);
      
      if (recordSnapshot.empty) {
        console.log('학습 기록 없음, 시청 시간 0 반환');
        return { success: true, watchedTime: 0 };
      }
      
      const record = recordSnapshot.docs[0].data();
      const watchedTime = record.watchedTime || record.progress || 0; // 호환성
      console.log('학습 시청 시간 조회 성공:', { watchedTime });
      return { 
        success: true, 
        watchedTime: watchedTime
      };
    } catch (error: any) {
      console.error('학습 시청 시간 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 학습 시청 시간 업데이트
   * @param userId 사용자 ID
   * @param contentId 콘텐츠 ID
   * @param watchedTime 시청 시간 (초)
   */
  updateProgress: async (userId: string, contentId: string, watchedTime: number) => {
    try {
      console.log('학습 시청 시간 업데이트 시작:', { userId, contentId, watchedTime });
      
      // 기존 학습 기록 확인
      const recordQuery = query(
        collection(firestore, 'learningRecords'),
        where('userId', '==', userId),
        where('contentId', '==', contentId)
      );
      
      const recordSnapshot = await getDocs(recordQuery);
      
      if (recordSnapshot.empty) {
        // 새 학습 기록 생성
        console.log('새 학습 기록 생성');
        await addDoc(collection(firestore, 'learningRecords'), {
          userId,
          contentId,
          watchedTime,
          progress: Math.floor((watchedTime / 100) * 100), // 호환성을 위해 계산
          completed: false,
          lastAccessDate: Timestamp.now()
        });
      } else {
        // 기존 학습 기록 업데이트
        const recordDoc = recordSnapshot.docs[0];
        console.log('기존 학습 기록 업데이트:', recordDoc.id);
        await updateDoc(doc(firestore, 'learningRecords', recordDoc.id), {
          watchedTime: watchedTime,
          progress: Math.floor((watchedTime / 100) * 100), // 호환성을 위해 계산
          lastAccessDate: Timestamp.now()
        });
      }
      
      console.log('학습 시청 시간 업데이트 완료');
      return { success: true };
    } catch (error: any) {
      console.error('학습 시청 시간 업데이트 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 학습 완료 처리
   * @param userId 사용자 ID
   * @param contentId 콘텐츠 ID
   * @param comment 완료 댓글
   */
  completeContent: async (userId: string, contentId: string, comment: string) => {
    try {
      console.log('=== Firebase completeContent 호출 ===');
      console.log('전달받은 userId:', userId);
      console.log('전달받은 contentId:', contentId);
      console.log('전달받은 comment:', comment);
      
      // 콘텐츠 정보 가져오기 (카테고리 정보 포함)
      const contentDoc = await getDoc(doc(firestore, 'contents', contentId));
      const contentData = contentDoc.exists() ? contentDoc.data() : null;
      const category = contentData?.category || '';
      
      // 기존 학습 기록 확인
      const recordQuery = query(
        collection(firestore, 'learningRecords'),
        where('userId', '==', userId),
        where('contentId', '==', contentId)
      );
      
      const recordSnapshot = await getDocs(recordQuery);
      const completionDate = Timestamp.now();
      
      if (recordSnapshot.empty) {
        // 새 학습 기록 생성 (완료 상태로)
        console.log('새 학습 기록 생성:', { userId, contentId, category });
        await addDoc(collection(firestore, 'learningRecords'), {
          userId,
          contentId,
          watchedTime: 0, // 시청 시간 기반으로 변경
          progress: 100,
          completed: true,
          completionDate,
          lastAccessDate: completionDate,
          comment,
          category
        });
      } else {
        // 기존 학습 기록 업데이트
        const recordDoc = recordSnapshot.docs[0];
        console.log('기존 학습 기록 업데이트:', recordDoc.id);
        await updateDoc(doc(firestore, 'learningRecords', recordDoc.id), {
          watchedTime: 0, // 시청 시간 기반으로 변경
          progress: 100,
          completed: true,
          completionDate,
          lastAccessDate: completionDate,
          comment,
          category
        });
      }
      
      // 댓글 컬렉션에도 저장
      console.log('댓글 컬렉션에 저장:', { userId, contentId, comment });
      await addDoc(collection(firestore, 'comments'), {
        userId,
        contentId,
        comment,
        createdAt: completionDate
      });
      
      console.log('=== Firebase completeContent 완료 ===');
      return { 
        success: true, 
        completionDate: completionDate.toDate().toISOString() 
      };
    } catch (error: any) {
      console.error('학습 완료 처리 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 사용자의 학습 중인 과정 가져오기
   * @param userId 사용자 ID
   */
  getInProgressContents: async (userId: string) => {
    try {
      const recordQuery = query(
        collection(firestore, 'learningRecords'),
        where('userId', '==', userId),
        where('completed', '==', false)
      );
      
      const recordSnapshot = await getDocs(recordQuery);
      const records: LearningRecord[] = [];
      
      for (const docSnapshot of recordSnapshot.docs) {
        const record = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as LearningRecord;
        
        // 콘텐츠 정보 가져오기
        const contentDoc = await getDoc(doc(firestore, 'contents', record.contentId));
        if (contentDoc.exists()) {
          const content = contentDoc.data() as Content;
          records.push({
            ...record,
            title: content.title,
            thumbnailUrl: content.thumbnailUrl
          } as LearningRecord & { title: string, thumbnailUrl: string });
        }
      }
      
      return { 
        success: true, 
        records: records.sort((a, b) => 
          b.lastAccessDate.toMillis() - a.lastAccessDate.toMillis()
        )
      };
    } catch (error: any) {
      console.error('학습 중인 과정 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 기존 학습 기록 마이그레이션 (카테고리 정보 추가)
   * @param userId 사용자 ID
   */
  migrateLearningRecords: async (userId: string) => {
    try {
      console.log('학습 기록 마이그레이션 시작:', userId);
      
      // 모든 학습 기록 가져오기 (디버깅용)
      const allRecordsQuery = query(collection(firestore, 'learningRecords'));
      const allRecordsSnapshot = await getDocs(allRecordsQuery);
      console.log('전체 학습 기록 개수:', allRecordsSnapshot.docs.length);
      
      // 각 기록의 사용자 ID 출력
      allRecordsSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`기록 ${index + 1}:`, {
          id: doc.id,
          userId: data.userId,
          contentId: data.contentId,
          completed: data.completed,
          category: data.category
        });
      });
      
      // 특정 사용자의 학습 기록 가져오기
      const recordQuery = query(
        collection(firestore, 'learningRecords'),
        where('userId', '==', userId)
      );
      
      const recordSnapshot = await getDocs(recordQuery);
      console.log('사용자별 학습 기록 개수:', recordSnapshot.docs.length);
      
      let migratedCount = 0;
      
      for (const docSnapshot of recordSnapshot.docs) {
        const record = docSnapshot.data();
        console.log('처리 중인 기록:', {
          id: docSnapshot.id,
          contentId: record.contentId,
          category: record.category,
          completed: record.completed
        });
        
        // 카테고리 정보가 없으면 콘텐츠에서 가져와서 업데이트
        if (!record.category) {
          const contentDoc = await getDoc(doc(firestore, 'contents', record.contentId));
          if (contentDoc.exists()) {
            const contentData = contentDoc.data();
            if (contentData.category) {
              await updateDoc(doc(firestore, 'learningRecords', docSnapshot.id), {
                category: contentData.category
              });
              migratedCount++;
              console.log('마이그레이션 완료:', docSnapshot.id, contentData.category);
            }
          }
        }
      }
      
      console.log('마이그레이션 완료:', migratedCount, '개 기록 업데이트');
      return { 
        success: true, 
        migratedCount 
      };
    } catch (error: any) {
      console.error('학습 기록 마이그레이션 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 테스트용 학습 기록 생성 (디버깅용)
   * @param userId 사용자 ID
   */
  createTestLearningRecord: async (userId: string) => {
    try {
      console.log('테스트 학습 기록 생성 시작:', userId);
      
      // 모든 콘텐츠 가져오기
      const contentsQuery = query(collection(firestore, 'contents'));
      const contentsSnapshot = await getDocs(contentsQuery);
      
      if (contentsSnapshot.empty) {
        console.log('콘텐츠가 없어서 테스트 기록을 생성할 수 없습니다.');
        return { success: false, error: '콘텐츠가 없습니다.' };
      }
      
      // 첫 번째 콘텐츠로 테스트 기록 생성
      const firstContent = contentsSnapshot.docs[0];
      const contentData = firstContent.data();
      
      const testRecord = {
        userId: userId,
        contentId: firstContent.id,
        progress: 100, 
        completed: true, 
        completionDate: Timestamp.now(),
        lastAccessDate: Timestamp.now(),
        comment: '테스트용 수료 댓글',
        category: contentData.category || '테스트'
      };
      
      const docRef = await addDoc(collection(firestore, 'learningRecords'), testRecord);
      console.log('테스트 학습 기록 생성 완료:', docRef.id);
      
      return { 
        success: true, 
        recordId: docRef.id 
      };
    } catch (error: any) {
      console.error('테스트 학습 기록 생성 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 테스트용 학습 기록 삭제 (정리용)
   * @param userId 사용자 ID
   */
  deleteTestLearningRecords: async (userId: string) => {
    try {
      console.log('테스트 학습 기록 삭제 시작:', userId);
      
      // 사용자의 모든 학습 기록 가져오기
      const recordQuery = query(
        collection(firestore, 'learningRecords'),
        where('userId', '==', userId),
        where('comment', '==', '테스트용 수료 댓글')
      );
      
      const recordSnapshot = await getDocs(recordQuery);
      let deletedCount = 0;
      
      for (const docSnapshot of recordSnapshot.docs) {
        await deleteDoc(doc(firestore, 'learningRecords', docSnapshot.id));
        deletedCount++;
        console.log('테스트 기록 삭제:', docSnapshot.id);
      }
      
      console.log('테스트 학습 기록 삭제 완료:', deletedCount, '개 삭제');
      return { 
        success: true, 
        deletedCount 
      };
    } catch (error: any) {
      console.error('테스트 학습 기록 삭제 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 사용자의 수료한 과정 가져오기
   * @param userId 사용자 ID
   */
  getCompletedContents: async (userId: string) => {
    try {
      const recordQuery = query(
        collection(firestore, 'learningRecords'),
        where('userId', '==', userId),
        where('completed', '==', true)
      );
      
      const recordSnapshot = await getDocs(recordQuery);
      const records: LearningRecord[] = [];
      
      for (const docSnapshot of recordSnapshot.docs) {
        const record = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as LearningRecord;
        
        // 콘텐츠 정보 가져오기
        const contentDoc = await getDoc(doc(firestore, 'contents', record.contentId));
        if (contentDoc.exists()) {
          const content = contentDoc.data() as Content;
          // 카테고리 정보가 없으면 콘텐츠에서 가져와서 업데이트
          if (!record.category && content.category) {
            record.category = content.category;
            // 기존 기록 업데이트
            await updateDoc(doc(firestore, 'learningRecords', docSnapshot.id), {
              category: content.category
            });
          }
          records.push({
            ...record,
            title: content.title,
            thumbnailUrl: content.thumbnailUrl
          } as LearningRecord & { title: string, thumbnailUrl: string });
        }
      }
      
      return { 
        success: true, 
        records: records.sort((a, b) => 
          b.completionDate!.toMillis() - a.completionDate!.toMillis()
        )
      };
    } catch (error: any) {
      console.error('수료한 과정 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * 추천 관련 함수
 */
export const likeService = {
  /**
   * 추천 추가/제거
   * @param userId 사용자 ID
   * @param contentId 콘텐츠 ID
   */
  toggleLike: async (userId: string, contentId: string) => {
    try {
      // 기존 추천 확인
      const likeQuery = query(
        collection(firestore, 'likes'),
        where('userId', '==', userId),
        where('contentId', '==', contentId)
      );
      
      const likeSnapshot = await getDocs(likeQuery);
      
      if (likeSnapshot.empty) {
        // 추천 추가
        await addDoc(collection(firestore, 'likes'), {
          userId,
          contentId,
          createdAt: Timestamp.now()
        });
        
        // 콘텐츠의 추천 수 증가
        await updateDoc(doc(firestore, 'contents', contentId), {
          likeCount: increment(1)
        });
        
        return { success: true, isLiked: true };
      } else {
        // 추천 제거
        const likeDoc = likeSnapshot.docs[0];
        await deleteDoc(doc(firestore, 'likes', likeDoc.id));
        
        // 콘텐츠의 추천 수 감소
        await updateDoc(doc(firestore, 'contents', contentId), {
          likeCount: increment(-1)
        });
        
        return { success: true, isLiked: false };
      }
    } catch (error: any) {
      console.error('추천 토글 에러:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 콘텐츠의 추천 여부 확인
   * @param userId 사용자 ID
   * @param contentId 콘텐츠 ID
   */
  isLiked: async (userId: string, contentId: string) => {
    try {
      const likeQuery = query(
        collection(firestore, 'likes'),
        where('userId', '==', userId),
        where('contentId', '==', contentId)
      );
      
      const likeSnapshot = await getDocs(likeQuery);
      return { success: true, isLiked: !likeSnapshot.empty };
    } catch (error: any) {
      console.error('추천 확인 에러:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * 즐겨찾기 관련 함수
 */
export const favoriteService = {
  /**
   * 콘텐츠 통계 업데이트 (즐겨찾기 수)
   * @param contentId 콘텐츠 ID
   */
  updateContentFavoriteCount: async (contentId: string) => {
    try {
      // 해당 콘텐츠의 즐겨찾기 수 계산
      const favoriteQuery = query(
        collection(firestore, 'favorites'),
        where('contentId', '==', contentId)
      );
      
      const favoriteSnapshot = await getDocs(favoriteQuery);
      const favoriteCount = favoriteSnapshot.size;
      
      // 콘텐츠 문서 업데이트
      const contentRef = doc(firestore, 'contents', contentId);
      await updateDoc(contentRef, {
        favoriteCount: favoriteCount
      });
      
      return { success: true, favoriteCount };
    } catch (error: any) {
      console.error('콘텐츠 즐겨찾기 수 업데이트 에러:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 사용자의 즐겨찾기 목록 가져오기
   * @param userId 사용자 ID
   */
  getFavorites: async (userId: string) => {
    try {
      // 사용자의 즐겨찾기 목록 가져오기 (인덱스 문제 해결을 위해 orderBy 제거)
      const favoriteQuery = query(
        collection(firestore, 'favorites'),
        where('userId', '==', userId)
      );
      
      const favoriteSnapshot = await getDocs(favoriteQuery);
      
      // 즐겨찾기 데이터를 배열로 변환하고 클라이언트에서 정렬
             const favoriteData = favoriteSnapshot.docs.map(doc => ({
               id: doc.id,
               ...doc.data()
             } as Favorite));
      
      // 클라이언트에서 최신순으로 정렬
      const sortedFavorites = favoriteData.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      if (sortedFavorites.length === 0) {
        return { success: true, favorites: [] };
      }
      
      // 즐겨찾기된 콘텐츠 정보 가져오기
      const contentPromises = sortedFavorites.map(async (favorite) => {
        const contentDoc = await getDoc(doc(firestore, 'contents', favorite.contentId));
        if (contentDoc.exists()) {
          return {
            ...contentDoc.data(),
            id: contentDoc.id,
            favoriteId: favorite.id
          };
        }
        return null;
      });
      
      const contents = (await Promise.all(contentPromises)).filter(content => content !== null);
      
      return { 
        success: true, 
        favorites: contents 
      };
    } catch (error: any) {
      console.error('즐겨찾기 목록 가져오기 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 즐겨찾기 추가/제거
   * @param userId 사용자 ID
   * @param contentId 콘텐츠 ID
   */
  toggleFavorite: async (userId: string, contentId: string) => {
    try {
      console.log('=== favoriteService.toggleFavorite 호출 ===');
      console.log('즐겨찾기 토글 시작:', { userId, contentId });
      
      // 기존 즐겨찾기 확인
      const favoriteQuery = query(
        collection(firestore, 'favorites'),
        where('userId', '==', userId),
        where('contentId', '==', contentId)
      );
      
      const favoriteSnapshot = await getDocs(favoriteQuery);
      console.log('기존 즐겨찾기 확인 결과:', { 
        foundRecords: favoriteSnapshot.docs.length,
        isEmpty: favoriteSnapshot.empty 
      });
      
      if (favoriteSnapshot.empty) {
        // 즐겨찾기 추가
        console.log('즐겨찾기 추가 중...');
        await addDoc(collection(firestore, 'favorites'), {
          userId,
          contentId,
          createdAt: Timestamp.now()
        });
        
        // 콘텐츠의 즐겨찾기 수 증가
        await updateDoc(doc(firestore, 'contents', contentId), {
          favoriteCount: increment(1)
        });
        
        console.log('즐겨찾기 추가 완료');
        return { success: true, isFavorite: true };
      } else {
        // 즐겨찾기 제거
        console.log('즐겨찾기 제거 중...');
        const favoriteDoc = favoriteSnapshot.docs[0];
        await deleteDoc(doc(firestore, 'favorites', favoriteDoc.id));
        
        // 콘텐츠의 즐겨찾기 수 감소
        await updateDoc(doc(firestore, 'contents', contentId), {
          favoriteCount: increment(-1)
        });
        
        console.log('즐겨찾기 제거 완료');
        return { success: true, isFavorite: false };
      }
    } catch (error: any) {
      console.error('즐겨찾기 토글 에러:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 사용자의 즐겨찾기 목록 가져오기
   * @param userId 사용자 ID
   */
  getUserFavorites: async (userId: string) => {
    try {
      // 인덱스 문제 해결을 위해 orderBy 제거 후 클라이언트에서 정렬
      const favoriteQuery = query(
        collection(firestore, 'favorites'),
        where('userId', '==', userId)
      );
      
      const favoriteSnapshot = await getDocs(favoriteQuery);
      const favorites: Favorite[] = [];
      
      // 즐겨찾기 데이터를 배열로 변환하고 클라이언트에서 정렬
             const favoriteData = favoriteSnapshot.docs.map(doc => ({
               id: doc.id,
               ...doc.data()
             } as Favorite));
      
      // 클라이언트에서 최신순으로 정렬
      const sortedFavorites = favoriteData.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime();
      });
      
      for (const favorite of sortedFavorites) {
        // 콘텐츠 정보 가져오기
        const contentDoc = await getDoc(doc(firestore, 'contents', favorite.contentId));
        if (contentDoc.exists()) {
          const contentData = {
            id: contentDoc.id,
            ...contentDoc.data()
          } as Content;
          
          const processedContent = await contentService.processContentUrls(contentData);
          favorites.push({
            ...favorite,
            content: processedContent
          } as Favorite & { content: Content });
        }
      }
      
      return { success: true, favorites };
    } catch (error: any) {
      console.error('즐겨찾기 목록 가져오기 에러:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 콘텐츠의 즐겨찾기 여부 확인
   * @param userId 사용자 ID
   * @param contentId 콘텐츠 ID
   */
  isFavorite: async (userId: string, contentId: string) => {
    try {
      console.log('즐겨찾기 상태 확인 시작:', { userId, contentId });
      
      const favoriteQuery = query(
        collection(firestore, 'favorites'),
        where('userId', '==', userId),
        where('contentId', '==', contentId)
      );
      
      const favoriteSnapshot = await getDocs(favoriteQuery);
      const isFavorite = !favoriteSnapshot.empty;
      
      console.log('즐겨찾기 상태 확인 결과:', { 
        userId, 
        contentId, 
        isFavorite, 
        foundRecords: favoriteSnapshot.docs.length 
      });
      
      return { success: true, isFavorite };
    } catch (error: any) {
      console.error('즐겨찾기 확인 에러:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

/**
 * 댓글 관련 함수
 */
export const commentService = {
  /**
   * 특정 콘텐츠의 댓글 목록 가져오기
   * @param contentId 콘텐츠 ID
   */
  getCommentsByContent: async (contentId: string) => {
    try {
      // 인덱스 이슈를 피하기 위해 서버 정렬을 제거하고, 클라이언트에서 정렬/필터 처리
      const commentsQuery = query(
        collection(firestore, 'comments'),
        where('contentId', '==', contentId)
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      const comments: any[] = [];
      
      for (const docSnapshot of commentsSnapshot.docs) {
        const commentData: any = docSnapshot.data();
        
        // 소프트 삭제된 댓글은 제외
        if (commentData.deleted === true) {
          continue;
        }
        
        // 사용자 정보 가져오기
        let userDisplayName = '익명';
        try {
          const userDoc = await getDoc(doc(firestore, 'user', commentData.userId));
          if (userDoc.exists()) {
            userDisplayName = (userDoc.data() as any).displayName || '익명';
          }
        } catch (e) {
          // 사용자 문서가 없거나 에러가 나도 중단하지 않음
        }
        
        comments.push({
          id: docSnapshot.id,
          ...commentData,
          userDisplayName
        });
      }
      
      // 클라이언트에서 최신순 정렬
      comments.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate?.() ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      
      return { success: true, comments };
    } catch (error: any) {
      console.error('댓글 목록 가져오기 에러:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 댓글 작성
   * @param userId 사용자 ID
   * @param contentId 콘텐츠 ID
   * @param comment 댓글 내용
   */
  addComment: async (userId: string, contentId: string, comment: string) => {
    try {
      const commentData = {
        userId,
        contentId,
        comment,
        createdAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(firestore, 'comments'), commentData);
      
      return {
        success: true,
        commentId: docRef.id
      };
    } catch (error: any) {
      console.error('댓글 작성 에러:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 댓글 수정
   * @param commentId 댓글 ID
   * @param newComment 새로운 댓글 내용
   */
  updateComment: async (commentId: string, newComment: string) => {
    try {
      const commentRef = doc(firestore, 'comments', commentId);
      await updateDoc(commentRef, {
        comment: newComment,
        updatedAt: Timestamp.now()
      });
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('댓글 수정 에러:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 댓글 삭제
   * @param commentId 댓글 ID
   */
  deleteComment: async (commentId: string) => {
    try {
      console.log('=== Firebase deleteComment 호출 ===');
      console.log('삭제할 댓글 ID:', commentId);
      
      // 현재 인증된 사용자 확인
      const currentUser = auth.currentUser;
      console.log('현재 인증된 사용자:', {
        uid: currentUser?.uid,
        email: currentUser?.email
      });
      
      // 사용자 문서에서 role 확인
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(firestore, 'user', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('사용자 문서 데이터:', {
              role: userData.role,
              status: userData.status,
              email: userData.email
            });
          } else {
            console.log('사용자 문서가 존재하지 않음');
          }
        } catch (userError) {
          console.error('사용자 문서 조회 에러:', userError);
        }
      }
      
      const commentRef = doc(firestore, 'comments', commentId);
      console.log('댓글 참조 생성:', commentRef.path);
      
      // 댓글 문서 존재 여부 확인
      const commentDoc = await getDoc(commentRef);
      if (commentDoc.exists()) {
        const commentData = commentDoc.data();
        console.log('삭제할 댓글 데이터:', {
          userId: commentData.userId,
          contentId: commentData.contentId,
          comment: commentData.comment
        });
      } else {
        console.log('댓글 문서가 존재하지 않음');
        return {
          success: false,
          error: '댓글을 찾을 수 없습니다.'
        };
      }
      
      await deleteDoc(commentRef);
      console.log('댓글 삭제 성공:', commentId);
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('댓글 삭제 에러 상세:', error);
      console.error('에러 코드:', error.code);
      console.error('에러 메시지:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * 댓글 소프트 삭제 (권한 문제 시 대안)
   */
  softDeleteComment: async (commentId: string) => {
    try {
      console.log('Firebase softDeleteComment 호출:', commentId);
      const commentRef = doc(firestore, 'comments', commentId);
      console.log('댓글 참조 생성:', commentRef.path);
      
      await updateDoc(commentRef, {
        deleted: true,
        deletedAt: Timestamp.now()
      });
      console.log('댓글 소프트 삭제 성공:', commentId);
      return { success: true };
    } catch (error: any) {
      console.error('댓글 소프트 삭제 에러 상세:', error);
      console.error('에러 코드:', error.code);
      console.error('에러 메시지:', error.message);
      return { success: false, error: error.message };
    }
  }
};

/**
 * 콘텐츠 캐싱 관련 함수
 * 
 * 참고: 실제 캐싱 구현은 react-native-fs와 같은 
 * 네이티브 파일 시스템 라이브러리를 사용해야 합니다.
 * 여기서는 인터페이스만 정의하고, 실제 구현은 추후 추가될 예정입니다.
 */
export const cachingService = {
  /**
   * 콘텐츠 캐싱 상태 확인
   * @param contentId 콘텐츠 ID
   */
  checkCacheStatus: async (contentId: string) => {
    // 실제 구현은 react-native-fs를 사용하여 파일 존재 여부 확인
    console.log('캐싱 상태 확인:', contentId);
    return { isCached: false, size: 0 };
  },

  /**
   * 콘텐츠 캐싱
   * @param contentId 콘텐츠 ID
   * @param url 콘텐츠 URL
   * @param type 'video' 또는 'audio'
   */
  cacheContent: async (contentId: string, url: string, type: 'video' | 'audio') => {
    // 실제 구현은 react-native-fs를 사용하여 파일 다운로드
    console.log('콘텐츠 캐싱:', { contentId, url, type });
    return { success: true, localUrl: `file:///cache/${type}/${contentId}` };
  },

  /**
   * 캐시된 콘텐츠 URL 가져오기
   * @param contentId 콘텐츠 ID
   * @param type 'video' 또는 'audio'
   */
  getCachedContentUrl: async (contentId: string, type: 'video' | 'audio') => {
    // 실제 구현은 react-native-fs를 사용하여 파일 경로 확인
    console.log('캐시된 콘텐츠 URL 요청:', { contentId, type });
    return `file:///cache/${type}/${contentId}`;
  },

  /**
   * 캐시 삭제
   * @param contentId 콘텐츠 ID (선택적, 없으면 모든 캐시 삭제)
   */
  clearCache: async (contentId?: string) => {
    // 실제 구현은 react-native-fs를 사용하여 파일 삭제
    if (contentId) {
      console.log('특정 콘텐츠 캐시 삭제:', contentId);
    } else {
      console.log('모든 캐시 삭제');
    }
    return { success: true };
  },
};

/**
 * 스토리지 관련 함수 (주로 관리자용)
 */
export const storageService = {
  /**
   * 파일 업로드
   * @param file 업로드할 파일
   * @param path 저장 경로
   * @param progressCallback 업로드 진행 상황 콜백
   */
  uploadFile: async (
    file: Blob, 
    path: string, 
    progressCallback?: (progress: number) => void
  ) => {
    try {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise<{ success: boolean, downloadUrl?: string, error?: string }>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (progressCallback) {
              progressCallback(progress);
            }
          },
          (error) => {
            console.error('파일 업로드 에러:', error);
            resolve({ success: false, error: error.message });
          },
          async () => {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve({ success: true, downloadUrl });
          }
        );
      });
    } catch (error: any) {
      console.error('파일 업로드 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },

  /**
   * 파일 삭제
   * @param path 파일 경로
   */
  deleteFile: async (path: string) => {
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      return { success: true };
    } catch (error: any) {
      console.error('파일 삭제 에러:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
};

/**
 * 큐레이션 관련 서비스
 */
export const curationService = {
  /**
   * 큐레이션 목록 가져오기
   */
  getCurations: async (): Promise<{ success: boolean; curations?: any[]; error?: string }> => {
    try {
      const curationsRef = collection(firestore, 'curations');
      const snapshot = await getDocs(curationsRef);
      const curations: any[] = [];
      
      snapshot.forEach((doc) => {
        curations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      return { success: true, curations };
    } catch (error: any) {
      console.error('큐레이션 목록 가져오기 에러:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * 특정 큐레이션의 콘텐츠 가져오기
   */
  getCurationContents: async (curationId: string): Promise<{ success: boolean; contents?: Content[]; error?: string }> => {
    try {
      // 큐레이션 정보 가져오기
      const curationDoc = await getDoc(doc(firestore, 'curations', curationId));
      if (!curationDoc.exists()) {
        return { success: false, error: '큐레이션을 찾을 수 없습니다.' };
      }
      
      const curationData = curationDoc.data();
      const contentIds = curationData.contentIds || [];
      
      if (contentIds.length === 0) {
        return { success: true, contents: [] };
      }
      
      // 콘텐츠 정보 가져오기
      const contents: Content[] = [];
      for (const contentId of contentIds) {
        const contentDoc = await getDoc(doc(firestore, 'contents', contentId));
        if (contentDoc.exists()) {
          contents.push({
            id: contentDoc.id,
            ...contentDoc.data()
          } as Content);
        }
      }
      
      return { success: true, contents };
    } catch (error: any) {
      console.error('큐레이션 콘텐츠 가져오기 에러:', error);
      return { success: false, error: error.message };
    }
  }
};

// Firebase 서비스 객체
const firebaseService = {
  auth: authService,
  content: contentService,
  category: categoryService,
  learning: learningService,
  comment: commentService,
  caching: cachingService,
  storage: storageService,
  curation: curationService,
  favorite: favoriteService,
  like: likeService,
  
  // 직접 접근이 필요한 경우를 위한 인스턴스 노출
  firebaseApp: app,
  firebaseAuth: auth,
  firestore: firestore,
  storageInstance: storage
};

export default firebaseService;