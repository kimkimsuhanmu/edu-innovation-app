import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import cors from "cors";

// Firebase Admin SDK 초기화
admin.initializeApp();

// CORS 핸들러 생성 (모든 Origin 허용)
const corsHandler = cors({origin: true});

export const uploadFile = functions.https.onRequest({
  memory: "1GiB",
  timeoutSeconds: 300,
}, (request: any, response: any) => {
  // CORS 미들웨어 실행
  corsHandler(request, response, async () => {
    functions.logger.info("함수가 요청을 받았습니다.", {method: request.method});

    if (request.method !== "POST") {
      functions.logger.error("잘못된 요청 메소드입니다:", request.method);
      response.status(405).send("Method Not Allowed");
      return;
    }

    try {
      // 1. 인증 토큰 확인
      const authToken = request.headers.authorization?.split("Bearer ")[1];
      if (!authToken) {
        functions.logger.error("인증 토큰이 없습니다.");
        throw new functions.https.HttpsError(
          "unauthenticated",
          "인증 토큰이 필요합니다."
        );
      }
      const decodedToken = await admin.auth().verifyIdToken(authToken);
      functions.logger.info("토큰이 성공적으로 인증되었습니다. UID:", decodedToken.uid);

      // 2. 요청 본문 파싱 및 유효성 검사
      const {fileData, filePath, contentType} = request.body;
      if (!fileData || !filePath || !contentType) {
        functions.logger.error("요청 본문에 필수 필드가 누락되었습니다.", {body: request.body});
        throw new functions.https.HttpsError(
          "invalid-argument",
          "fileData, filePath, contentType 필드는 필수입니다."
        );
      }
      functions.logger.info("요청 본문이 성공적으로 파싱되었습니다. 파일 경로:", filePath);

      // 3. Base64 데이터 디코딩 및 버퍼 생성
      // 데이터 URI 접두사(예: "data:video/mp4;base64,")가 있을 경우 제거
      const base64EncodedString = fileData.includes(",") ?
        fileData.split(",")[1] : fileData;
      const buffer = Buffer.from(base64EncodedString, "base64");
      functions.logger.info("Base64 데이터가 버퍼로 성공적으로 디코딩되었습니다.");

      // 4. Cloud Storage에 업로드
      const bucket = admin.storage().bucket();
      const file = bucket.file(filePath);

      functions.logger.info("Storage에 버퍼 저장을 시도합니다...");
      await file.save(buffer, {
        metadata: {
          contentType: contentType,
        },
      });
      functions.logger.info("파일이 Storage에 성공적으로 저장되었습니다.");

      // 5. 성공 응답 전송
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      response.status(200).json({
        success: true,
        downloadUrl: publicUrl,
      });
    } catch (error) {
      functions.logger.error("!!! 함수 내에서 처리되지 않은 심각한 오류 발생 !!!", error);
      if (error instanceof functions.https.HttpsError) {
        response.status(400).json({success: false, error: error.message});
      } else {
        response.status(500).json({
          success: false,
          error: "Internal Server Error",
        });
      }
    }
  });
});

