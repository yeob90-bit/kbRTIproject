import { describe, expect, it } from 'vitest';
import { calculateRTI, createRentLoanExamples } from '../utils/calculations';
import { roundToUnit } from '../utils/rounding';
import type { LoanConditions } from '../types/loan';

describe('calculateRTI', () => {
  it('계산 테스트 1: 기본 조건에서 RTI 미충족 케이스를 정확히 산출한다', () => {
    const input: LoanConditions = {
      monthlyRent: 20_000_000,
      requestedLoanAmount: 3_810_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      borrowerType: 'corporate',
    };

    const result = calculateRTI(input, 'round');

    expect(result.annualRent).toBe(240_000_000);
    expect(result.reviewRate).toBeCloseTo(0.061, 10);
    expect(result.normalAnnualInterest).toBeCloseTo(156_210_000, 3);
    expect(result.stressedAnnualInterest).toBeCloseTo(232_410_000, 3);
    expect(result.currentRTI).not.toBeNull();
    expect(result.currentRTI!).toBeCloseTo(1.0327, 3);
    expect(result.maxLoanByRTI).toBeCloseTo(2_622_950_819.67, 0);
    expect(result.roundedMaxLoanByRTI).toBe(2_623_000_000);
    expect(result.requiredMonthlyRent).toBeCloseTo(29_051_250, 0);
    expect(result.isRTISatisfied).toBe(false);
    expect(result.loanDifference).toBe(input.requestedLoanAmount - result.roundedMaxLoanByRTI);
  });

  it('현재 RTI가 목표 RTI를 충족하면 isRTISatisfied가 true를 반환한다', () => {
    const input: LoanConditions = {
      monthlyRent: 20_000_000,
      requestedLoanAmount: 1_000_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      borrowerType: 'corporate',
    };

    const result = calculateRTI(input, 'round');
    expect(result.currentRTI).not.toBeNull();
    expect(result.currentRTI! >= input.targetRTI).toBe(true);
    expect(result.isRTISatisfied).toBe(true);
  });

  it('대출 희망금액이 0이면 currentRTI와 isRTISatisfied가 null이다', () => {
    const input: LoanConditions = {
      monthlyRent: 20_000_000,
      requestedLoanAmount: 0,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      borrowerType: 'corporate',
    };

    const result = calculateRTI(input, 'round');
    expect(result.currentRTI).toBeNull();
    expect(result.isRTISatisfied).toBeNull();
    expect(result.normalAnnualInterest).toBe(0);
    expect(result.stressedAnnualInterest).toBe(0);
  });

  it('목표 RTI가 0이면 최대 대출금액과 필요 월세가 0이다', () => {
    const input: LoanConditions = {
      monthlyRent: 20_000_000,
      requestedLoanAmount: 1_000_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 0,
      borrowerType: 'corporate',
    };

    const result = calculateRTI(input, 'round');
    expect(result.maxLoanByRTI).toBe(0);
    expect(result.roundedMaxLoanByRTI).toBe(0);
    expect(result.requiredMonthlyRent).toBe(0);
  });
});

describe('roundToUnit', () => {
  it('round 모드는 100만원 단위로 반올림한다', () => {
    expect(roundToUnit(2_622_950_819.67, 1_000_000, 'round')).toBe(2_623_000_000);
    expect(roundToUnit(2_622_400_000, 1_000_000, 'round')).toBe(2_622_000_000);
  });

  it('floor 모드는 100만원 단위로 절사한다', () => {
    expect(roundToUnit(2_622_950_819.67, 1_000_000, 'floor')).toBe(2_622_000_000);
  });

  it('ceil 모드는 100만원 단위로 올림한다', () => {
    expect(roundToUnit(2_622_000_000.01, 1_000_000, 'ceil')).toBe(2_623_000_000);
  });

  it('음수나 비유한수는 0을 반환한다', () => {
    expect(roundToUnit(-100, 1_000_000, 'round')).toBe(0);
    expect(roundToUnit(Number.NaN, 1_000_000, 'round')).toBe(0);
    expect(roundToUnit(Number.POSITIVE_INFINITY, 1_000_000, 'round')).toBe(0);
  });
});

describe('createRentLoanExamples', () => {
  it('지정된 범위와 간격으로 예시행을 생성한다', () => {
    const examples = createRentLoanExamples({
      startMonthlyRent: 1_000_000,
      endMonthlyRent: 5_000_000,
      rentStep: 1_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      roundingMode: 'round',
    });

    expect(examples).toHaveLength(5);
    expect(examples[0]!.monthlyRent).toBe(1_000_000);
    expect(examples[4]!.monthlyRent).toBe(5_000_000);
    expect(examples[0]!.annualRent).toBe(12_000_000);
  });

  it('잘못된 범위(종료 < 시작)는 빈 배열을 반환한다', () => {
    const examples = createRentLoanExamples({
      startMonthlyRent: 5_000_000,
      endMonthlyRent: 1_000_000,
      rentStep: 1_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      roundingMode: 'round',
    });

    expect(examples).toEqual([]);
  });

  it('금리와 목표 RTI가 0 이하이면 빈 배열을 반환한다', () => {
    const examples = createRentLoanExamples({
      startMonthlyRent: 1_000_000,
      endMonthlyRent: 5_000_000,
      rentStep: 1_000_000,
      appliedRatePercent: 0,
      stressRatePercent: 0,
      targetRTI: 1.5,
      roundingMode: 'round',
    });

    expect(examples).toEqual([]);
  });
});
