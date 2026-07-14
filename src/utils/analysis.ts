import type { RTICalculationResult } from '../types/loan';
import { formatEok, formatManwon, formatRatio } from './formatters';

/**
 * 계산엔진 결과만을 사용하여 코드 기반 분석문구를 생성한다.
 * AI를 재호출하지 않으며, 이 함수 내부에서 추가 산술 계산을 하지 않는다.
 */
export function generateAnalysisSummary(result: RTICalculationResult, targetRTI: number, requestedLoanAmount: number): string {
  const { currentRTI, isRTISatisfied, roundedMaxLoanByRTI, loanDifference, requiredMonthlyRent } = result;

  if (currentRTI === null || isRTISatisfied === null) {
    return '대출 희망금액 또는 검토금리가 입력되지 않아 현재 RTI를 계산할 수 없습니다. 입력조건을 확인해 주세요.';
  }

  const currentRTIText = formatRatio(currentRTI);
  const targetRTIText = formatRatio(targetRTI);
  const maxLoanEokText = formatEok(roundedMaxLoanByRTI);

  if (isRTISatisfied) {
    const surplusEokText = formatEok(Math.abs(loanDifference));
    return [
      `현재 RTI는 ${currentRTIText}로 목표 RTI ${targetRTIText}를 충족합니다.`,
      `RTI 기준 최대 대출금액은 ${maxLoanEokText}이며,`,
      `현재 희망금액 대비 ${surplusEokText}의 추가 여력이 있습니다.`,
    ].join('\n');
  }

  const requestedEokText = formatEok(requestedLoanAmount);
  const exceedEokText = formatEok(Math.abs(loanDifference));
  const requiredRentText = formatManwon(requiredMonthlyRent);

  return [
    `현재 RTI는 ${currentRTIText}로 목표 RTI ${targetRTIText}에 미달합니다.`,
    `RTI 기준 최대 대출금액은 ${maxLoanEokText}이며,`,
    `희망금액 ${requestedEokText}은 기준 한도를 ${exceedEokText} 초과합니다.`,
    `현재 대출금액을 유지하려면 월 임대료가 약 ${requiredRentText} 이상 필요합니다.`,
  ].join('\n');
}
