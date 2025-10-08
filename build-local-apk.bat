@echo off
echo ===== 김포도시관리공사 e-캠퍼스 APK 빌드 스크립트 =====
echo.

echo 1. 의존성 설치 중...
call npm install
if %ERRORLEVEL% neq 0 (
    echo 의존성 설치 실패!
    exit /b %ERRORLEVEL%
)

echo 2. EAS CLI 설치 중...
call npm install -g eas-cli
if %ERRORLEVEL% neq 0 (
    echo EAS CLI 설치 실패!
    exit /b %ERRORLEVEL%
)

echo 3. EAS 로그인 중...
call eas login
if %ERRORLEVEL% neq 0 (
    echo EAS 로그인 실패!
    exit /b %ERRORLEVEL%
)

echo 4. APK 빌드 중... (약 15-20분 소요)
call eas build --platform android --profile preview --non-interactive
if %ERRORLEVEL% neq 0 (
    echo APK 빌드 실패!
    exit /b %ERRORLEVEL%
)

echo.
echo ===== 빌드 완료! =====
echo APK 파일이 성공적으로 생성되었습니다.
echo EAS 대시보드에서 다운로드할 수 있습니다.
echo.

pause
