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

echo 5. APK 다운로드 중...
call eas build:list --platform android --limit 1 --json > build-info.json
for /f "tokens=*" %%i in ('type build-info.json ^| jq -r ".[0].artifacts.buildUrl"') do set BUILD_URL=%%i

if not "%BUILD_URL%"=="null" (
    echo APK 다운로드 URL: %BUILD_URL%
    curl -L -o "김포도시관리공사-e-캠퍼스.apk" "%BUILD_URL%"
    if %ERRORLEVEL% equ 0 (
        echo APK 파일이 성공적으로 다운로드되었습니다: 김포도시관리공사-e-캠퍼스.apk
    ) else (
        echo APK 다운로드 실패. EAS 대시보드에서 수동으로 다운로드하세요.
    )
) else (
    echo APK URL을 찾을 수 없습니다. EAS 대시보드에서 확인하세요.
)

echo.
echo ===== 빌드 완료! =====
echo EAS 대시보드: https://expo.dev
echo.

pause
