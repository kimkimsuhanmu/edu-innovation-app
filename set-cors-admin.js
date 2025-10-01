// Firebase Admin SDK를 사용한 CORS 설정 스크립트
// 이 스크립트를 실행하려면 Firebase 서비스 계정 키가 필요합니다

const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

// Firebase Admin SDK 초기화
// 실제 서비스 계정 키 파일 경로를 입력하세요
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gucedu-d5a97.appspot.com'
});

const storage = new Storage({
  projectId: 'gucedu-d5a97',
  keyFilename: './path/to/serviceAccountKey.json'
});

const bucket = storage.bucket('gucedu-d5a97.appspot.com');

// CORS 설정
const corsConfig = [
  {
    origin: ['https://admin-dashboard-6553e.web.app', 'http://localhost:3000'],
    method: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAgeSeconds: 3600,
    responseHeader: ['Content-Type', 'Authorization']
  }
];

async function setCorsConfig() {
  try {
    console.log('CORS 설정을 적용하는 중...');
    await bucket.setCorsConfiguration(corsConfig);
    console.log('✅ CORS 설정이 성공적으로 적용되었습니다!');
    console.log('설정된 CORS 규칙:', JSON.stringify(corsConfig, null, 2));
  } catch (error) {
    console.error('❌ CORS 설정 실패:', error);
  }
}

setCorsConfig();
