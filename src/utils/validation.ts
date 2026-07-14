import type { BorrowerType, LoanConditions, RoundingMode } from '../types/loan';

export interface FieldValidationResult {
  valid: boolean;
  errors: string[];
}

const VALID_BORROWER_TYPES: BorrowerType[] = ['individual', 'corporate', 'unknown'];
const VALID_ROUNDING_MODES: RoundingMode[] = ['round', 'floor', 'ceil'];

export function isValidBorrowerType(value: unknown): value is BorrowerType {
  return typeof value === 'string' && VALID_BORROWER_TYPES.includes(value as BorrowerType);
}

export function isValidRoundingMode(value: unknown): value is RoundingMode {
  return typeof value === 'string' && VALID_ROUNDING_MODES.includes(value as RoundingMode);
}

export function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isNonNegativeFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * 계산 실행에 필요한 필수 입력조건이 모두 유효한 값인지 검증한다.
 */
export function validateLoanConditions(input: Partial<LoanConditions>): FieldValidationResult {
  const errors: string[] = [];

  if (!isPositiveFiniteNumber(input.monthlyRent)) {
    errors.push('월 임대료는 0보다 큰 숫자여야 합니다.');
  }
  if (!isPositiveFiniteNumber(input.requestedLoanAmount)) {
    errors.push('대출 희망금액은 0보다 큰 숫자여야 합니다.');
  }
  if (!isNonNegativeFiniteNumber(input.appliedRatePercent)) {
    errors.push('적용금리는 0 이상의 숫자여야 합니다.');
  }
  if (!isNonNegativeFiniteNumber(input.stressRatePercent)) {
    errors.push('스트레스금리는 0 이상의 숫자여야 합니다.');
  }
  if (!isPositiveFiniteNumber(input.targetRTI)) {
    errors.push('목표 RTI는 0보다 큰 숫자여야 합니다.');
  }
  if (input.borrowerType !== undefined && !isValidBorrowerType(input.borrowerType)) {
    errors.push('차주 유형 값이 올바르지 않습니다.');
  }
  if (
    input.ltvPercent !== undefined &&
    input.ltvPercent !== null &&
    (!Number.isFinite(input.ltvPercent) || input.ltvPercent < 0 || input.ltvPercent > 100)
  ) {
    errors.push('LTV는 0~100 사이의 숫자여야 합니다.');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * localStorage에서 불러온 값의 유효성을 검증한다. 잘못된 값이면 기본값으로 복구되어야 하므로
 * 호출자는 valid === false인 경우 기본값을 사용해야 한다.
 */
export function validateStoredRateSettings(value: unknown): FieldValidationResult {
  const errors: string[] = [];
  if (typeof value !== 'object' || value === null) {
    return { valid: false, errors: ['저장된 값이 객체 형식이 아닙니다.'] };
  }

  const record = value as Record<string, unknown>;

  if (!isNonNegativeFiniteNumber(record.appliedRatePercent)) errors.push('appliedRatePercent 값이 올바르지 않습니다.');
  if (!isNonNegativeFiniteNumber(record.stressRatePercent)) errors.push('stressRatePercent 값이 올바르지 않습니다.');
  if (!isPositiveFiniteNumber(record.targetRTI)) errors.push('targetRTI 값이 올바르지 않습니다.');
  if (!isPositiveFiniteNumber(record.startMonthlyRent)) errors.push('startMonthlyRent 값이 올바르지 않습니다.');
  if (!isPositiveFiniteNumber(record.endMonthlyRent)) errors.push('endMonthlyRent 값이 올바르지 않습니다.');
  if (
    typeof record.endMonthlyRent === 'number' &&
    typeof record.startMonthlyRent === 'number' &&
    record.endMonthlyRent < record.startMonthlyRent
  ) {
    errors.push('endMonthlyRent는 startMonthlyRent보다 크거나 같아야 합니다.');
  }
  if (!isPositiveFiniteNumber(record.rentStep)) errors.push('rentStep 값이 올바르지 않습니다.');
  if (!isValidRoundingMode(record.roundingMode)) errors.push('roundingMode 값이 올바르지 않습니다.');

  return { valid: errors.length === 0, errors };
}
