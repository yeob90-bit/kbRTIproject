import type { RentLoanExample, RoundingMode } from '../types/loan';
import { formatEok, formatPercent, formatRatio, formatWon } from '../utils/formatters';

interface RentLoanExampleTableProps {
  examples: RentLoanExample[];
  startMonthlyRent: number;
  endMonthlyRent: number;
  rentStep: number;
  onRangeChange: (patch: { startMonthlyRent?: number; endMonthlyRent?: number; rentStep?: number }) => void;
  appliedRatePercent: number;
  stressRatePercent: number;
  targetRTI: number;
  roundingMode: RoundingMode;
}

function toNumberOrZero(raw: string): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function RentLoanExampleTable({
  examples,
  startMonthlyRent,
  endMonthlyRent,
  rentStep,
  onRangeChange,
  appliedRatePercent,
  stressRatePercent,
  targetRTI,
  roundingMode,
}: RentLoanExampleTableProps) {
  const reviewRate = appliedRatePercent + stressRatePercent;

  return (
    <section
      aria-labelledby="rent-example-heading"
      className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
    >
      <h2 id="rent-example-heading" className="text-base font-semibold text-gray-900">
        월세별 예상 대출금액 표
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        현재 적용금리 {formatPercent(appliedRatePercent)}, 스트레스금리 {formatPercent(stressRatePercent)}, 목표 RTI{' '}
        {formatRatio(targetRTI)} 기준으로 계산됩니다.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="rent-start" className="block text-sm font-medium text-gray-700">
            시작 월세 <span className="text-xs text-gray-400">(원)</span>
          </label>
          <input
            id="rent-start"
            type="number"
            min={0}
            value={startMonthlyRent}
            onChange={(e) => onRangeChange({ startMonthlyRent: toNumberOrZero(e.target.value) })}
            className="input-field mt-1"
          />
        </div>
        <div>
          <label htmlFor="rent-end" className="block text-sm font-medium text-gray-700">
            종료 월세 <span className="text-xs text-gray-400">(원)</span>
          </label>
          <input
            id="rent-end"
            type="number"
            min={0}
            value={endMonthlyRent}
            onChange={(e) => onRangeChange({ endMonthlyRent: toNumberOrZero(e.target.value) })}
            className="input-field mt-1"
          />
        </div>
        <div>
          <label htmlFor="rent-step" className="block text-sm font-medium text-gray-700">
            월세 간격 <span className="text-xs text-gray-400">(원)</span>
          </label>
          <input
            id="rent-step"
            type="number"
            min={1}
            value={rentStep}
            onChange={(e) => onRangeChange({ rentStep: toNumberOrZero(e.target.value) })}
            className="input-field mt-1"
          />
        </div>
      </div>

      <div className="table-scroll mt-4 max-h-96 rounded-md border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                월 임대료
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                연간 임대료
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                적용금리
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                스트레스금리
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                검토금리
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                목표 RTI
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                최대 대출금액
              </th>
              <th scope="col" className="whitespace-nowrap px-3 py-2 text-right font-medium text-gray-600">
                억원 환산
              </th>
            </tr>
          </thead>
          <tbody>
            {examples.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-4 text-center text-gray-400">
                  표를 생성할 수 없습니다. 범위와 계산조건을 확인해 주세요.
                </td>
              </tr>
            ) : (
              examples.map((example) => (
                <tr key={example.monthlyRent} className="border-t border-gray-100">
                  <td className="num whitespace-nowrap px-3 py-1.5 text-gray-900">{formatWon(example.monthlyRent)}</td>
                  <td className="num whitespace-nowrap px-3 py-1.5 text-gray-700">{formatWon(example.annualRent)}</td>
                  <td className="num whitespace-nowrap px-3 py-1.5 text-gray-700">{formatPercent(appliedRatePercent)}</td>
                  <td className="num whitespace-nowrap px-3 py-1.5 text-gray-700">{formatPercent(stressRatePercent)}</td>
                  <td className="num whitespace-nowrap px-3 py-1.5 text-gray-700">{formatPercent(reviewRate)}</td>
                  <td className="num whitespace-nowrap px-3 py-1.5 text-gray-700">{formatRatio(targetRTI)}</td>
                  <td className="num whitespace-nowrap px-3 py-1.5 font-medium text-gray-900">
                    {formatWon(example.roundedMaxLoan)}
                  </td>
                  <td className="num whitespace-nowrap px-3 py-1.5 font-medium text-gold-700">
                    {formatEok(example.roundedMaxLoan)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        최대 대출금액은 {roundingMode === 'round' ? '100만원 단위로 반올림' : roundingMode === 'floor' ? '100만원 단위로 절사' : '100만원 단위로 올림'}
        되어 표시됩니다.
      </p>
    </section>
  );
}
