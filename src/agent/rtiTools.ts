import { calculateRTI, createRentLoanExamples } from '../utils/calculations.js';
import type { LoanConditions, RoundingMode } from '../types/loan.js';
import type {
  CalculateRequiredRentInput,
  CalculateRTIInput,
  CompareRatesInput,
  CreateRentLoanTableInput,
  UpdateConditionsInput,
} from './schemas.js';

export interface ToolResultEnvelope<T> {
  toolName: string;
  input: unknown;
  output: T;
  updatedConditions?: Partial<LoanConditions>;
  tableSettings?: {
    startMonthlyRent: number;
    endMonthlyRent: number;
    rentStep: number;
  };
}

function mergeConditions(
  current: LoanConditions,
  patch: Partial<Pick<LoanConditions, 'monthlyRent' | 'requestedLoanAmount' | 'appliedRatePercent' | 'stressRatePercent' | 'targetRTI' | 'borrowerType'>>,
): LoanConditions {
  return {
    ...current,
    ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
  };
}

function serializeRTIResult(conditions: LoanConditions, roundingMode: RoundingMode = 'round') {
  const result = calculateRTI(conditions, roundingMode);
  return {
    annualRent: result.annualRent,
    appliedRatePercent: conditions.appliedRatePercent,
    stressRatePercent: conditions.stressRatePercent,
    reviewRatePercent: result.reviewRate * 100,
    normalAnnualInterest: result.normalAnnualInterest,
    stressedAnnualInterest: result.stressedAnnualInterest,
    currentRTI: result.currentRTI,
    maxLoanByRTI: result.maxLoanByRTI,
    roundedMaxLoanByRTI: result.roundedMaxLoanByRTI,
    loanDifference: result.loanDifference,
    isRTISatisfied: result.isRTISatisfied,
    requiredMonthlyRent: result.requiredMonthlyRent,
    targetRTI: conditions.targetRTI,
    requestedLoanAmount: conditions.requestedLoanAmount,
    monthlyRent: conditions.monthlyRent,
  };
}

/** calculateRTI 도구 실행 — 기존 TypeScript 계산엔진만 사용.
 * 산출된 최대 대출금액(100만원 단위)을 대출 희망금액으로 화면에 동기화한다.
 */
export function runCalculateRTITool(
  current: LoanConditions,
  input: CalculateRTIInput,
  roundingMode: RoundingMode = 'round',
): ToolResultEnvelope<ReturnType<typeof serializeRTIResult>> {
  const conditions = mergeConditions(current, input);
  const output = serializeRTIResult(conditions, roundingMode);
  return {
    toolName: 'calculateRTI',
    input,
    output,
    updatedConditions: {
      monthlyRent: conditions.monthlyRent,
      // 상담 산출 최대가능금액을 대출 희망금액 입력란에 반영
      requestedLoanAmount: output.roundedMaxLoanByRTI,
      appliedRatePercent: conditions.appliedRatePercent,
      stressRatePercent: conditions.stressRatePercent,
      targetRTI: conditions.targetRTI,
    },
  };
}

/** compareRates 도구 실행 */
export function runCompareRatesTool(
  current: LoanConditions,
  input: CompareRatesInput,
  roundingMode: RoundingMode = 'round',
): ToolResultEnvelope<{
  baseAppliedRatePercent: number;
  rows: Array<{
    appliedRatePercent: number;
    reviewRatePercent: number;
    currentRTI: number | null;
    roundedMaxLoanByRTI: number;
    isRTISatisfied: boolean | null;
    deltaVsBaseLoan: number;
  }>;
}> {
  const base = mergeConditions(current, {
    monthlyRent: input.monthlyRent,
    requestedLoanAmount: input.requestedLoanAmount,
    stressRatePercent: input.stressRatePercent,
    targetRTI: input.targetRTI,
  });
  const baseResult = calculateRTI(base, roundingMode);

  const rows = input.appliedRatesPercent.map((appliedRatePercent) => {
    const conditions = { ...base, appliedRatePercent };
    const result = calculateRTI(conditions, roundingMode);
    return {
      appliedRatePercent,
      reviewRatePercent: result.reviewRate * 100,
      currentRTI: result.currentRTI,
      roundedMaxLoanByRTI: result.roundedMaxLoanByRTI,
      isRTISatisfied: result.isRTISatisfied,
      deltaVsBaseLoan: result.roundedMaxLoanByRTI - baseResult.roundedMaxLoanByRTI,
    };
  });

  return {
    toolName: 'compareRates',
    input,
    output: {
      baseAppliedRatePercent: base.appliedRatePercent,
      rows,
    },
    updatedConditions: {
      monthlyRent: base.monthlyRent,
      requestedLoanAmount: base.requestedLoanAmount,
      stressRatePercent: base.stressRatePercent,
      targetRTI: base.targetRTI,
    },
  };
}

/** calculateRequiredRent 도구 실행 */
export function runCalculateRequiredRentTool(
  current: LoanConditions,
  input: CalculateRequiredRentInput,
): ToolResultEnvelope<{ requiredMonthlyRent: number; requiredAnnualRent: number }> {
  const conditions = mergeConditions(current, input);
  const result = calculateRTI(conditions, 'round');
  return {
    toolName: 'calculateRequiredRent',
    input,
    output: {
      requiredMonthlyRent: result.requiredMonthlyRent,
      requiredAnnualRent: result.requiredMonthlyRent * 12,
    },
    updatedConditions: {
      requestedLoanAmount: conditions.requestedLoanAmount,
      appliedRatePercent: conditions.appliedRatePercent,
      stressRatePercent: conditions.stressRatePercent,
      targetRTI: conditions.targetRTI,
    },
  };
}

/** createRentLoanTable 도구 실행 */
export function runCreateRentLoanTableTool(
  current: LoanConditions,
  input: CreateRentLoanTableInput,
  roundingMode: RoundingMode = 'round',
): ToolResultEnvelope<{
  rows: Array<{ monthlyRent: number; annualRent: number; roundedMaxLoan: number }>;
}> {
  const appliedRatePercent = input.appliedRatePercent ?? current.appliedRatePercent;
  const stressRatePercent = input.stressRatePercent ?? current.stressRatePercent;
  const targetRTI = input.targetRTI ?? current.targetRTI;

  const examples = createRentLoanExamples({
    startMonthlyRent: input.startMonthlyRent,
    endMonthlyRent: input.endMonthlyRent,
    rentStep: input.rentStep,
    appliedRatePercent,
    stressRatePercent,
    targetRTI,
    roundingMode,
  });

  return {
    toolName: 'createRentLoanTable',
    input,
    output: {
      rows: examples.map((row) => ({
        monthlyRent: row.monthlyRent,
        annualRent: row.annualRent,
        roundedMaxLoan: row.roundedMaxLoan,
      })),
    },
    updatedConditions: {
      appliedRatePercent,
      stressRatePercent,
      targetRTI,
    },
    tableSettings: {
      startMonthlyRent: input.startMonthlyRent,
      endMonthlyRent: input.endMonthlyRent,
      rentStep: input.rentStep,
    },
  };
}

/** updateConditions 도구 — 변경된 필드만 반영 */
export function runUpdateConditionsTool(
  current: LoanConditions,
  input: UpdateConditionsInput,
): ToolResultEnvelope<{ updated: LoanConditions; changedFields: string[] }> {
  const changedFields = Object.entries(input)
    .filter(([, value]) => value !== undefined)
    .map(([key]) => key);

  const updated = mergeConditions(current, input);
  return {
    toolName: 'updateConditions',
    input,
    output: { updated, changedFields },
    updatedConditions: input,
  };
}
