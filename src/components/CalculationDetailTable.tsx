import type { LoanConditions, RTICalculationResult } from '../types/loan';
import { formatPercent, formatRatio, formatWon } from '../utils/formatters';

interface CalculationDetailTableProps {
  conditions: LoanConditions;
  result: RTICalculationResult;
}

export function CalculationDetailTable({ conditions, result }: CalculationDetailTableProps) {
  const rows: { label: string; value: string }[] = [
    { label: '월 임대료', value: formatWon(conditions.monthlyRent) },
    { label: '연간 임대료', value: formatWon(result.annualRent) },
    { label: '대출 희망금액', value: formatWon(conditions.requestedLoanAmount) },
    { label: '적용금리', value: formatPercent(result.appliedRate * 100) },
    { label: '스트레스금리', value: formatPercent(result.stressRate * 100) },
    { label: '검토금리 (적용+스트레스)', value: formatPercent(result.reviewRate * 100) },
    { label: '정상 연간 이자', value: formatWon(result.normalAnnualInterest) },
    { label: '스트레스 반영 연간 이자', value: formatWon(result.stressedAnnualInterest) },
    { label: '현재 RTI', value: formatRatio(result.currentRTI) },
    { label: '목표 RTI', value: formatRatio(conditions.targetRTI) },
    { label: '최대 대출금액 (RTI 기준, 반올림 전)', value: formatWon(result.maxLoanByRTI) },
    { label: '최대 대출금액 (100만원 단위 처리)', value: formatWon(result.roundedMaxLoanByRTI) },
  ];

  return (
    <section aria-labelledby="detail-table-heading" className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 id="detail-table-heading" className="text-base font-semibold text-gray-900">
        상세 계산표
      </h2>

      <div className="table-scroll mt-4 max-h-96 rounded-md border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="px-4 py-2 text-left font-medium text-gray-600">
                항목
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium text-gray-600">
                값
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-gray-100">
                <td className="px-4 py-2 text-gray-700">{row.label}</td>
                <td className="num px-4 py-2 font-medium text-gray-900">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
