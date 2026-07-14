import type { LoanConditions, RentLoanExample, RTICalculationResult, RoundingMode } from '../types/loan.js';
import { roundToUnit } from './rounding.js';

/**
 * RTI(임대업이자상환비율) 및 관련 대출한도를 계산하는 순수 함수.
 * AI는 이 계산에 관여하지 않으며, 오직 입력조건만 추출한다.
 *
 * 계산식:
 * - 연간 임대료 = 월 임대료 × 12
 * - 검토금리 = 적용금리 + 스트레스금리
 * - 정상 연간 이자 = 대출 희망금액 × 적용금리
 * - 스트레스 반영 연간 이자 = 대출 희망금액 × 검토금리
 * - 현재 RTI = 연간 임대료 ÷ 스트레스 반영 연간 이자
 * - 목표 RTI 기준 최대 대출금액 = 연간 임대료 ÷ (목표 RTI × 검토금리)
 * - 필요 월세 = 대출 희망금액 × 검토금리 × 목표 RTI ÷ 12
 */
export function calculateRTI(input: LoanConditions, roundingMode: RoundingMode = 'round'): RTICalculationResult {
  const annualRent = input.monthlyRent * 12;
  const appliedRate = input.appliedRatePercent / 100;
  const stressRate = input.stressRatePercent / 100;
  const reviewRate = appliedRate + stressRate;

  const normalAnnualInterest = input.requestedLoanAmount > 0 ? input.requestedLoanAmount * appliedRate : 0;

  const stressedAnnualInterest = input.requestedLoanAmount > 0 ? input.requestedLoanAmount * reviewRate : 0;

  const currentRTI = stressedAnnualInterest > 0 ? annualRent / stressedAnnualInterest : null;

  const maxLoanByRTI =
    annualRent > 0 && reviewRate > 0 && input.targetRTI > 0 ? annualRent / (input.targetRTI * reviewRate) : 0;

  const roundedMaxLoanByRTI = roundToUnit(maxLoanByRTI, 1_000_000, roundingMode);

  const loanDifference = input.requestedLoanAmount - roundedMaxLoanByRTI;

  const requiredMonthlyRent =
    input.requestedLoanAmount > 0 && reviewRate > 0 && input.targetRTI > 0
      ? (input.requestedLoanAmount * reviewRate * input.targetRTI) / 12
      : 0;

  return {
    annualRent,
    appliedRate,
    stressRate,
    reviewRate,
    normalAnnualInterest,
    stressedAnnualInterest,
    currentRTI,
    maxLoanByRTI,
    roundedMaxLoanByRTI,
    loanDifference,
    isRTISatisfied: currentRTI === null ? null : currentRTI >= input.targetRTI,
    requiredMonthlyRent,
  };
}

export interface RentLoanExampleParams {
  startMonthlyRent: number;
  endMonthlyRent: number;
  rentStep: number;
  appliedRatePercent: number;
  stressRatePercent: number;
  targetRTI: number;
  roundingMode: RoundingMode;
}

/** 최대 생성 가능한 예시행 개수(무한루프 및 과도한 렌더링 방지) */
const MAX_EXAMPLE_ROWS = 1000;

/**
 * 월세별 예상 최대 대출금액 표를 생성한다.
 */
export function createRentLoanExamples({
  startMonthlyRent,
  endMonthlyRent,
  rentStep,
  appliedRatePercent,
  stressRatePercent,
  targetRTI,
  roundingMode,
}: RentLoanExampleParams): RentLoanExample[] {
  const reviewRate = (appliedRatePercent + stressRatePercent) / 100;

  if (
    !Number.isFinite(startMonthlyRent) ||
    !Number.isFinite(endMonthlyRent) ||
    !Number.isFinite(rentStep) ||
    startMonthlyRent <= 0 ||
    endMonthlyRent < startMonthlyRent ||
    rentStep <= 0 ||
    reviewRate <= 0 ||
    targetRTI <= 0
  ) {
    return [];
  }

  const result: RentLoanExample[] = [];
  const estimatedRows = Math.floor((endMonthlyRent - startMonthlyRent) / rentStep) + 1;
  const rowLimit = Math.min(estimatedRows, MAX_EXAMPLE_ROWS);

  let monthlyRent = startMonthlyRent;
  for (let i = 0; i < rowLimit; i += 1) {
    const annualRent = monthlyRent * 12;
    const maxLoan = annualRent / (targetRTI * reviewRate);

    result.push({
      monthlyRent,
      annualRent,
      maxLoan,
      roundedMaxLoan: roundToUnit(maxLoan, 1_000_000, roundingMode),
    });

    monthlyRent += rentStep;
  }

  return result;
}
