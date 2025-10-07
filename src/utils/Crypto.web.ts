// 웹 환경을 위한 Crypto 모듈 구현

/**
 * 문자열을 해시하는 함수 (웹 환경용)
 * @param str 해시할 문자열
 * @returns 해시된 문자열
 */
export const hashString = async (str: string): Promise<string> => {
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

export default {
  hashString
};
