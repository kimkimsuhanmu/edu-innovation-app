# 김포도시관리공사 e-캠퍼스

React Native + Expo로 개발된 교육 플랫폼 앱입니다.

## 기능

- 📚 교육 콘텐츠 시청
- 🎵 오디오 모드 재생 (백그라운드 재생 지원)
- ❤️ 즐겨찾기 기능
- 💬 학습 후기 작성
- 📊 학습 진도 추적
- 🔐 사용자 인증 및 권한 관리

## 빌드 방법

### GitHub Actions를 사용한 자동 빌드

1. **Expo 토큰 설정**
   - [Expo Dashboard](https://expo.dev/accounts/taesan/projects/EduInnovationApp)에서 토큰 생성
   - GitHub Repository Settings > Secrets > Actions에서 `EXPO_TOKEN` 추가

2. **빌드 실행**
   - `main` 또는 `master` 브랜치에 푸시하면 자동으로 빌드 시작
   - 또는 GitHub Actions 탭에서 수동 실행 가능

3. **APK 다운로드**
   - 빌드 완료 후 Actions 탭에서 APK 파일 다운로드 가능

### 로컬 빌드

```bash
# 의존성 설치
cd EduInnovationApp
npm install

# EAS CLI 설치
npm install -g eas-cli

# Expo 로그인
eas login

# APK 빌드
eas build --platform android --profile preview
```

## 프로젝트 구조

```
EduInnovationApp/
├── src/
│   ├── screens/          # 화면 컴포넌트
│   ├── components/       # 재사용 가능한 컴포넌트
│   ├── services/         # Firebase 및 API 서비스
│   ├── navigation/       # 네비게이션 설정
│   └── state/           # 상태 관리
├── assets/              # 이미지 및 아이콘
├── .github/workflows/   # GitHub Actions 설정
└── app.json            # Expo 앱 설정
```

## 주요 기술 스택

- **Frontend**: React Native, Expo
- **Backend**: Firebase (Firestore, Authentication, Storage)
- **State Management**: React Context API
- **Navigation**: React Navigation
- **Video Player**: React Native Video
- **Build**: EAS Build, GitHub Actions

## 개발 환경 설정

1. Node.js 20+ 설치
2. Expo CLI 설치: `npm install -g @expo/cli`
3. 프로젝트 클론 및 의존성 설치
4. Firebase 설정 파일 추가
5. `npx expo start`로 개발 서버 시작

## 배포

- **APK**: GitHub Actions를 통한 자동 빌드
- **AAB**: 구글 플레이 스토어 등록용 (production 프로필 사용)
- **웹**: PWA 지원으로 모바일에서도 앱처럼 사용 가능

## 라이선스

이 프로젝트는 MIT 라이선스 하에 있습니다.