export interface PrivacyCheckResult {
  hasSensitiveInfo: boolean;
  reasons: string[];
}

export const PRIVACY_WARNING_MESSAGE =
  '개인정보 또는 고객식별정보로 추정되는 내용이 발견되었습니다.\n해당 내용을 삭제한 후 금액과 계산조건만 입력해 주세요.';

export const PRIVACY_BANNER_MESSAGE =
  '고객명, 주민등록번호, 사업자등록번호, 계좌번호, 실제 상호, 상세주소 및 내부 신용등급 등 고객식별정보와 내부 비공개정보는 입력하지 마십시오.';

// 주민등록번호: YYMMDD-N followed by 6 digits (하이픈 유무 모두 허용, 뒤 6자리 중 첫자리는 1-4 성별코드가 일반적이나 보수적으로 넓게 검사)
const RESIDENT_ID_PATTERN = /\b\d{6}[-\s]?[1-4]\d{6}\b/;

// 사업자등록번호: 3-2-5 형식 (하이픈 필수 - 단순 숫자열과 구분하기 위함)
const BUSINESS_ID_PATTERN = /\b\d{3}-\d{2}-\d{5}\b/;

// 전화번호: 010-1234-5678, 02-123-4567 등 (하이픈 포함 형식만 탐지하여 금액 숫자와 혼동 방지)
const PHONE_PATTERN = /\b0\d{1,2}[-\s]\d{3,4}[-\s]\d{4}\b/;

// 이메일 주소
const EMAIL_PATTERN = /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/;

// 계좌번호로 추정되는 패턴: 하이픈이 포함된 10자리 이상 숫자열 (금액 표현은 보통 하이픈을 쓰지 않으므로 구분 가능)
const ACCOUNT_LIKE_PATTERN = /\b\d{2,6}(-\d{2,6}){2,}\b/;

/**
 * 개인정보 또는 고객식별정보로 추정되는 패턴을 탐지한다.
 * 금액 표현(예: 3,810,000,000원, 38억1천만원)은 하이픈이 없거나 화폐 단위를 동반하므로
 * 위 패턴과 혼동되지 않도록 보수적으로 설계되었다.
 */
export function checkPrivacyRisk(text: string): PrivacyCheckResult {
  const reasons: string[] = [];

  if (RESIDENT_ID_PATTERN.test(text)) {
    reasons.push('주민등록번호로 추정되는 패턴');
  }
  if (BUSINESS_ID_PATTERN.test(text)) {
    reasons.push('사업자등록번호로 추정되는 패턴');
  }
  if (PHONE_PATTERN.test(text)) {
    reasons.push('전화번호로 추정되는 패턴');
  }
  if (EMAIL_PATTERN.test(text)) {
    reasons.push('이메일 주소로 추정되는 패턴');
  }
  if (ACCOUNT_LIKE_PATTERN.test(text)) {
    reasons.push('계좌번호로 추정되는 패턴');
  }

  return {
    hasSensitiveInfo: reasons.length > 0,
    reasons,
  };
}
