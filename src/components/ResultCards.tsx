import type { RTICalculationResult } from '../types/loan';
import { formatEok, formatManwon, formatPercent, formatRatio, formatSignedEok } from '../utils/formatters';

interface ResultCardsProps {
  result: RTICalculationResult;
  targetRTI: number;
}

export function ResultCards({ result, targetRTI }: ResultCardsProps) {
  const { currentRTI, isRTISatisfied, roundedMaxLoanByRTI, loanDifference, requiredMonthlyRent, appliedRate } = result;

  return (
    <section aria-labelledby="results-heading" className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 id="results-heading" className="text-base font-semibold text-gray-900">
        계산 결과
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* 최대 대출 가능금액: 가장 크게 표시 */}
        <div className="sm:col-span-2 rounded-lg border-2 border-gold-400 bg-gold-50 px-5 py-4">
          <p className="text-sm font-medium text-gold-800">RTI 기준 최대 대출 가능금액</p>
          <p className="num mt-1 text-3xl font-bold text-gold-900 sm:text-4xl">{formatEok(roundedMaxLoanByRTI)}</p>
        </div>

        <div className="rounded-md border border-gray-200 px-4 py-3">
          <p className="text-sm font-medium text-gray-600">현재 RTI</p>
          <p className="num mt-1 text-2xl font-semibold text-gray-900">{formatRatio(currentRTI)}</p>
          <p className="text-xs text-gray-400">목표 RTI {formatRatio(targetRTI)}</p>
        </div>

        <div
          className={`rounded-md border px-4 py-3 ${
            isRTISatisfied === null
              ? 'border-gray-200'
              : isRTISatisfied
                ? 'border-emerald-300 bg-emerald-50'
                : 'border-red-300 bg-red-50'
          }`}
        >
          <p className="text-sm font-medium text-gray-600">목표 RTI 충족 여부</p>
          <p
            className={`mt-1 text-2xl font-semibold ${
              isRTISatisfied === null ? 'text-gray-500' : isRTISatisfied ? 'text-emerald-700' : 'text-red-700'
            }`}
          >
            {isRTISatisfied === null ? '판정 불가' : isRTISatisfied ? '충족' : '미충족'}
          </p>
        </div>

        <div className="rounded-md border border-gray-200 px-4 py-3">
          <p className="text-sm font-medium text-gray-600">희망금액 대비 초과/여유</p>
          <p
            className={`num mt-1 text-2xl font-semibold ${
              loanDifference > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            {loanDifference > 0 ? `${formatEok(loanDifference)} 초과` : `${formatEok(Math.abs(loanDifference))} 여유`}
          </p>
        </div>

        <div className="rounded-md border border-gray-200 px-4 py-3">
          <p className="text-sm font-medium text-gray-600">필요 월세 (목표 RTI 충족 기준)</p>
          <p className="num mt-1 text-2xl font-semibold text-gray-900">{formatManwon(requiredMonthlyRent)}</p>
        </div>

        <div className="rounded-md border border-gray-200 px-4 py-3 sm:col-span-2">
          <p className="text-sm font-medium text-gray-600">최종 검토금리</p>
          <p className="num mt-1 text-2xl font-semibold text-gray-900">{formatPercent(appliedRate * 100)}</p>
        </div>
      </div>

      {loanDifference !== 0 && isRTISatisfied !== null && (
        <p className="mt-3 text-xs text-gray-400">
          부호 참고: {isRTISatisfied ? '여유금액' : '초과금액'} = {formatSignedEok(-loanDifference)}
        </p>
      )}
    </section>
  );
}
