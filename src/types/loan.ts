export type BorrowerType = 'individual' | 'corporate' | 'unknown';

export type RoundingMode = 'round' | 'floor' | 'ceil';

export interface LoanConditions {
  monthlyRent: number;
  requestedLoanAmount: number;
  appliedRatePercent: number;
  stressRatePercent: number;
  targetRTI: number;
  borrowerType: BorrowerType;
  propertyPrice?: number | null;
  collateralValue?: number | null;
  ltvPercent?: number | null;
}

export interface ParsedLoanConditions {
  monthlyRent: number | null;
  requestedLoanAmount: number | null;
  appliedRatePercent: number | null;
  stressRatePercent: number | null;
  targetRTI: number | null;
  borrowerType: BorrowerType;
  propertyPrice: number | null;
  collateralValue: number | null;
  ltvPercent: number | null;
  missingFields: string[];
  warnings: string[];
}

export interface RTICalculationResult {
  annualRent: number;
  appliedRate: number;
  stressRate: number;
  reviewRate: number;
  normalAnnualInterest: number;
  stressedAnnualInterest: number;
  currentRTI: number | null;
  maxLoanByRTI: number;
  roundedMaxLoanByRTI: number;
  loanDifference: number;
  isRTISatisfied: boolean | null;
  requiredMonthlyRent: number;
}

export interface RentLoanExample {
  monthlyRent: number;
  annualRent: number;
  maxLoan: number;
  roundedMaxLoan: number;
}

export interface RentLoanExampleTableSettings {
  startMonthlyRent: number;
  endMonthlyRent: number;
  rentStep: number;
  roundingMode: RoundingMode;
}

export const REQUIRED_FIELD_LABELS: Record<string, string> = {
  monthlyRent: '월 임대료',
  requestedLoanAmount: '대출 희망금액',
  appliedRatePercent: '적용금리',
  stressRatePercent: '스트레스금리',
  targetRTI: '목표 RTI',
};

export const BORROWER_TYPE_LABELS: Record<BorrowerType, string> = {
  individual: '개인',
  corporate: '법인(기업)',
  unknown: '미확인',
};
