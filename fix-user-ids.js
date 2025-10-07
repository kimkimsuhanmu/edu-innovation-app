// Firebase에서 잘못된 userId "current-user-id"를 정리하는 스크립트
// 이 스크립트는 Firebase Admin SDK를 사용하여 실행해야 합니다.

const admin = require('firebase-admin');

// Firebase Admin SDK 초기화 (서비스 계정 키 필요)
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixUserIds() {
  console.log('=== 잘못된 userId 정리 시작 ===');
  
  try {
    // comments 컬렉션에서 "current-user-id"를 가진 문서들 찾기
    const commentsSnapshot = await db.collection('comments')
      .where('userId', '==', 'current-user-id')
      .get();
    
    console.log(`찾은 잘못된 댓글 수: ${commentsSnapshot.size}`);
    
    if (commentsSnapshot.size > 0) {
      console.log('⚠️  잘못된 userId를 가진 댓글들을 발견했습니다.');
      console.log('이 댓글들은 삭제하거나 수동으로 수정해야 합니다.');
      
      commentsSnapshot.forEach(doc => {
        console.log(`- 댓글 ID: ${doc.id}, 내용: ${doc.data().comment}`);
      });
      
      // 사용자 확인 후 삭제할지 결정
      console.log('\n이 댓글들을 삭제하시겠습니까? (y/n)');
      // 실제 실행 시에는 사용자 입력을 받아야 합니다.
    }
    
    // learningRecords 컬렉션에서도 확인
    const learningRecordsSnapshot = await db.collection('learningRecords')
      .where('userId', '==', 'current-user-id')
      .get();
    
    console.log(`찾은 잘못된 학습 기록 수: ${learningRecordsSnapshot.size}`);
    
    if (learningRecordsSnapshot.size > 0) {
      console.log('⚠️  잘못된 userId를 가진 학습 기록들을 발견했습니다.');
      
      learningRecordsSnapshot.forEach(doc => {
        console.log(`- 학습 기록 ID: ${doc.id}, 콘텐츠: ${doc.data().contentId}`);
      });
    }
    
    console.log('=== 정리 완료 ===');
    
  } catch (error) {
    console.error('에러 발생:', error);
  }
}

// 스크립트 실행
fixUserIds().then(() => {
  console.log('스크립트 실행 완료');
  process.exit(0);
}).catch(error => {
  console.error('스크립트 실행 실패:', error);
  process.exit(1);
});
