import { z } from 'zod';
import type { BorrowerType } from '../types/loan.js';

export const borrowerTypeSchema = z.enum(['individual', 'corporate', 'unknown']);

export const loanConditionsSchema = z.object({
  monthlyRent: z.number().finite().nonnegative(),
  requestedLoanAmount: z.number().finite().nonnegative(),
  appliedRatePercent: z.number().finite().nonnegative(),
  stressRatePercent: z.number().finite().nonnegative(),
  targetRTI: z.number().finite().positive(),
  borrowerType: borrowerTypeSchema.default('unknown'),
  propertyPrice: z.number().finite().nullable().optional(),
  collateralValue: z.number().finite().nullable().optional(),
  ltvPercent: z.number().finite().nullable().optional(),
});

export const calculateRTIInputSchema = z.object({
  monthlyRent: z.number().finite().nonnegative().optional().describe('월 임대료(원). 생략 시 현재 상담조건 사용'),
  requestedLoanAmount: z
    .number()
    .finite()
    .nonnegative()
    .optional()
    .describe('대출 희망금액(원). 생략 시 현재 상담조건 사용'),
  appliedRatePercent: z.number().finite().nonnegative().optional().describe('적용/제안금리(%). 생략 시 현재 상담조건 사용'),
  stressRatePercent: z
    .number()
    .finite()
    .nonnegative()
    .optional()
    .describe('스트레스금리(%p). 생략 시 현재 상담조건 사용'),
  targetRTI: z.number().finite().positive().optional().describe('목표 RTI(배). 생략 시 현재 상담조건 사용'),
});

export const compareRatesInputSchema = z.object({
  monthlyRent: z.number().finite().nonnegative().optional(),
  requestedLoanAmount: z.number().finite().nonnegative().optional(),
  appliedRatesPercent: z
    .array(z.number().finite().nonnegative())
    .min(1)
    .max(10)
    .describe('비교할 적용금리(%) 목록'),
  stressRatePercent: z.number().finite().nonnegative().optional(),
  targetRTI: z.number().finite().positive().optional(),
});

export const calculateRequiredRentInputSchema = z.object({
  requestedLoanAmount: z.number().finite().nonnegative().optional(),
  appliedRatePercent: z.number().finite().nonnegative().optional(),
  stressRatePercent: z.number().finite().nonnegative().optional(),
  targetRTI: z.number().finite().positive().optional(),
});

export const createRentLoanTableInputSchema = z.object({
  startMonthlyRent: z.number().finite().positive().describe('시작 월세(원)'),
  endMonthlyRent: z.number().finite().positive().describe('종료 월세(원)'),
  rentStep: z.number().finite().positive().describe('월세 간격(원)'),
  appliedRatePercent: z.number().finite().nonnegative().optional(),
  stressRatePercent: z.number().finite().nonnegative().optional(),
  targetRTI: z.number().finite().positive().optional(),
});

export const updateConditionsInputSchema = z.object({
  monthlyRent: z.number().finite().nonnegative().optional(),
  requestedLoanAmount: z.number().finite().nonnegative().optional(),
  appliedRatePercent: z.number().finite().nonnegative().optional(),
  stressRatePercent: z.number().finite().nonnegative().optional(),
  targetRTI: z.number().finite().positive().optional(),
  borrowerType: borrowerTypeSchema.optional(),
});

export type CalculateRTIInput = z.infer<typeof calculateRTIInputSchema>;
export type CompareRatesInput = z.infer<typeof compareRatesInputSchema>;
export type CalculateRequiredRentInput = z.infer<typeof calculateRequiredRentInputSchema>;
export type CreateRentLoanTableInput = z.infer<typeof createRentLoanTableInputSchema>;
export type UpdateConditionsInput = z.infer<typeof updateConditionsInputSchema>;
export type ValidatedBorrowerType = BorrowerType;
