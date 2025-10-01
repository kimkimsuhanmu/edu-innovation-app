const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');

// Firebase Admin SDK 초기화
const serviceAccount = {
  // 실제 서비스 계정 키가 필요합니다
  // Firebase Console > Project Settings > Service Accounts에서 생성
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gucedu-d5a97.appspot.com'
});

const storage = new Storage({
  projectId: 'gucedu-d5a97'
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
    await bucket.setCorsConfiguration(corsConfig);
    console.log('CORS 설정이 성공적으로 적용되었습니다.');
  } catch (error) {
    console.error('CORS 설정 실패:', error);
  }
}

setCorsConfig();
