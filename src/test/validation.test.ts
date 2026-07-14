import { describe, expect, it } from 'vitest';
import { validateLoanConditions, validateStoredRateSettings } from '../utils/validation';
import { checkPrivacyRisk } from '../utils/privacy';

describe('validateLoanConditions', () => {
  it('필수 값이 모두 유효하면 통과한다', () => {
    const result = validateLoanConditions({
      monthlyRent: 20_000_000,
      requestedLoanAmount: 3_810_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      borrowerType: 'corporate',
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('월 임대료가 0 이하이면 오류를 반환한다', () => {
    const result = validateLoanConditions({
      monthlyRent: 0,
      requestedLoanAmount: 3_810_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('월 임대료'))).toBe(true);
  });

  it('LTV가 100을 초과하면 오류를 반환한다', () => {
    const result = validateLoanConditions({
      monthlyRent: 20_000_000,
      requestedLoanAmount: 3_810_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      ltvPercent: 150,
    });

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('LTV'))).toBe(true);
  });
});

describe('validateStoredRateSettings', () => {
  it('올바른 저장값은 valid: true를 반환한다', () => {
    const result = validateStoredRateSettings({
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      startMonthlyRent: 1_000_000,
      endMonthlyRent: 30_000_000,
      rentStep: 1_000_000,
      roundingMode: 'round',
    });

    expect(result.valid).toBe(true);
  });

  it('잘못된 roundingMode 값은 valid: false를 반환한다', () => {
    const result = validateStoredRateSettings({
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      startMonthlyRent: 1_000_000,
      endMonthlyRent: 30_000_000,
      rentStep: 1_000_000,
      roundingMode: 'invalid-mode',
    });

    expect(result.valid).toBe(false);
  });

  it('종료 월세가 시작 월세보다 작으면 valid: false를 반환한다', () => {
    const result = validateStoredRateSettings({
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      startMonthlyRent: 30_000_000,
      endMonthlyRent: 1_000_000,
      rentStep: 1_000_000,
      roundingMode: 'round',
    });

    expect(result.valid).toBe(false);
  });

  it('객체가 아닌 값은 valid: false를 반환한다', () => {
    expect(validateStoredRateSettings(null).valid).toBe(false);
    expect(validateStoredRateSettings('not-an-object').valid).toBe(false);
    expect(validateStoredRateSettings(undefined).valid).toBe(false);
  });
});

describe('checkPrivacyRisk', () => {
  it('주민등록번호 형식을 탐지한다', () => {
    const result = checkPrivacyRisk('고객 주민등록번호는 900101-1234567 입니다.');
    expect(result.hasSensitiveInfo).toBe(true);
  });

  it('사업자등록번호 형식을 탐지한다', () => {
    const result = checkPrivacyRisk('사업자등록번호 123-45-67890으로 조회해줘.');
    expect(result.hasSensitiveInfo).toBe(true);
  });

  it('전화번호 형식을 탐지한다', () => {
    const result = checkPrivacyRisk('연락처는 010-1234-5678 입니다.');
    expect(result.hasSensitiveInfo).toBe(true);
  });

  it('이메일 주소를 탐지한다', () => {
    const result = checkPrivacyRisk('담당자 이메일은 test@example.com 입니다.');
    expect(result.hasSensitiveInfo).toBe(true);
  });

  it('계좌번호로 추정되는 하이픈 포함 숫자열을 탐지한다', () => {
    const result = checkPrivacyRisk('계좌번호 123-456-789012 로 입금 부탁합니다.');
    expect(result.hasSensitiveInfo).toBe(true);
  });

  it('금액 표현(하이픈 없는 큰 숫자, 억/만원 표기)은 개인정보로 오탐하지 않는다', () => {
    const result = checkPrivacyRisk(
      '월세 2천만원이고 대출은 38억1천만원을 신청할 예정이야. 적용금리는 4.1%, 스트레스금리는 2%, 목표 RTI는 1.5배야.',
    );
    expect(result.hasSensitiveInfo).toBe(false);
  });

  it('일반적인 계산조건 문장은 개인정보로 오탐하지 않는다', () => {
    const result = checkPrivacyRisk('연 임대료가 2억4천만원이고, 대출은 30억원이야. 금리 3.9%, 스트레스 2%, 목표 RTI 1.5배로 봐줘.');
    expect(result.hasSensitiveInfo).toBe(false);
  });
});
