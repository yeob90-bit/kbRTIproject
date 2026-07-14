import { describe, expect, it } from 'vitest';
import {
  runCalculateRequiredRentTool,
  runCalculateRTITool,
  runCompareRatesTool,
  runCreateRentLoanTableTool,
  runUpdateConditionsTool,
} from '../agent/rtiTools';
import type { LoanConditions } from '../types/loan';

const base: LoanConditions = {
  monthlyRent: 20_000_000,
  requestedLoanAmount: 3_810_000_000,
  appliedRatePercent: 4.1,
  stressRatePercent: 2,
  targetRTI: 1.5,
  borrowerType: 'corporate',
};

describe('rti agent tools', () => {
  it('calculateRTI uses existing engine and syncs requested amount to max loan', () => {
    const result = runCalculateRTITool(base, {});
    expect(result.toolName).toBe('calculateRTI');
    expect(result.output.currentRTI).toBeCloseTo(1.03, 2);
    expect(result.updatedConditions?.monthlyRent).toBe(20_000_000);
    expect(result.updatedConditions?.requestedLoanAmount).toBe(result.output.roundedMaxLoanByRTI);
  });

  it('updateConditions changes only provided fields', () => {
    const result = runUpdateConditionsTool(base, { appliedRatePercent: 3.8 });
    expect(result.output.changedFields).toEqual(['appliedRatePercent']);
    expect(result.updatedConditions).toEqual({ appliedRatePercent: 3.8 });
    expect(result.output.updated.monthlyRent).toBe(base.monthlyRent);
    expect(result.output.updated.appliedRatePercent).toBe(3.8);
  });

  it('compareRates returns one row per rate', () => {
    const result = runCompareRatesTool(base, { appliedRatesPercent: [3.8, 4.1, 4.5] });
    expect(result.output.rows).toHaveLength(3);
    expect(result.output.rows[1]?.appliedRatePercent).toBe(4.1);
  });

  it('calculateRequiredRent returns monthly and annual rent', () => {
    const result = runCalculateRequiredRentTool(base, {});
    expect(result.output.requiredMonthlyRent).toBeGreaterThan(0);
    expect(result.output.requiredAnnualRent).toBeCloseTo(result.output.requiredMonthlyRent * 12, 0);
  });

  it('createRentLoanTable returns rows and tableSettings', () => {
    const result = runCreateRentLoanTableTool(base, {
      startMonthlyRent: 10_000_000,
      endMonthlyRent: 30_000_000,
      rentStep: 10_000_000,
    });
    expect(result.output.rows.length).toBe(3);
    expect(result.tableSettings?.startMonthlyRent).toBe(10_000_000);
  });
});
