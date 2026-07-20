import { useMemo, useState } from 'react';
import { calculateRTI, createRentLoanExamples } from '../../utils/calculations';
import { generateAnalysisSummary } from '../../utils/analysis';
import { downloadCsv } from '../../utils/csv';
import type { LoanConditions, RoundingMode } from '../../types/loan';

const DEMO_PRESETS = [
  {
    id: 'preset-a',
    label: '예시 A · 월세 2천만원 / 대출 38.1억',
    conditions: {
      monthlyRent: 20_000_000,
      requestedLoanAmount: 3_810_000_000,
      appliedRatePercent: 4.1,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      borrowerType: 'corporate' as const,
      propertyPrice: null,
      collateralValue: null,
      ltvPercent: null,
    },
  },
  {
    id: 'preset-b',
    label: '예시 B · 월세 1.5천만원 / 대출 25억',
    conditions: {
      monthlyRent: 15_000_000,
      requestedLoanAmount: 2_500_000_000,
      appliedRatePercent: 3.9,
      stressRatePercent: 2.0,
      targetRTI: 1.5,
      borrowerType: 'corporate' as const,
      propertyPrice: null,
      collateralValue: null,
      ltvPercent: null,
    },
  },
] as const;

function formatWon(value: number): string {
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function formatEok(value: number): string {
  return `${(value / 100_000_000).toFixed(2)}억원`;
}

export function DemoSection() {
  const [conditions, setConditions] = useState<LoanConditions>(DEMO_PRESETS[0].conditions);
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('round');
  const [activePreset, setActivePreset] = useState<string>(DEMO_PRESETS[0].id);

  const result = useMemo(() => calculateRTI(conditions, roundingMode), [conditions, roundingMode]);
  const analysis = useMemo(
    () => generateAnalysisSummary(result, conditions.targetRTI, conditions.requestedLoanAmount),
    [result, conditions.targetRTI, conditions.requestedLoanAmount],
  );
  const rentExamples = useMemo(
    () =>
      createRentLoanExamples({
        startMonthlyRent: 10_000_000,
        endMonthlyRent: 30_000_000,
        rentStep: 5_000_000,
        appliedRatePercent: conditions.appliedRatePercent,
        stressRatePercent: conditions.stressRatePercent,
        targetRTI: conditions.targetRTI,
        roundingMode,
      }),
    [conditions, roundingMode],
  );

  function loadPreset(id: string) {
    const preset = DEMO_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setActivePreset(id);
    setConditions({ ...preset.conditions });
  }

  function handleCsvDownload() {
    const rows: (string | number)[][] = [
      ['Showcase 정적 Demo RTI 결과'],
      [],
      ['항목', '값'],
      ['월 임대료(원)', conditions.monthlyRent],
      ['대출 희망금액(원)', conditions.requestedLoanAmount],
      ['적용금리(%)', conditions.appliedRatePercent],
      ['스트레스금리(%p)', conditions.stressRatePercent],
      ['목표 RTI(배)', conditions.targetRTI],
      ['현재 RTI(배)', result.currentRTI ?? ''],
      ['최대 대출금액(원)', result.roundedMaxLoanByRTI],
      ['필요 월세(원)', result.requiredMonthlyRent],
      [],
      ['월세별 예상 대출금액'],
      ['월 임대료(원)', '최대 대출금액(원)'],
      ...rentExamples.map((row) => [row.monthlyRent, row.roundedMaxLoan]),
    ];
    downloadCsv(`showcase_rti_demo_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <section id="demo" aria-labelledby="demo-heading" className="scroll-mt-24 border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <h2 id="demo-heading" className="text-2xl font-bold text-gray-900">
          정적 Demo · RTI 계산기
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">
          공개 데모에서는 개인정보 보호와 API 사용량 관리를 위해
          AI 자연어 분석 대신 예시 추출결과를 제공합니다.
          아래 계산은 Gemini를 호출하지 않으며 TypeScript 계산엔진만 사용합니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {DEMO_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => loadPreset(preset.id)}
              className={`inline-flex min-h-10 items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activePreset === preset.id
                  ? 'bg-gold-500 text-white'
                  : 'border border-gray-300 bg-white text-gray-800 hover:border-gold-400 hover:bg-gold-50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h3 className="text-base font-semibold text-gray-900">예시 입력값</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">월 임대료</dt>
                <dd className="font-medium text-gray-900">{formatWon(conditions.monthlyRent)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">대출 희망금액</dt>
                <dd className="font-medium text-gray-900">{formatEok(conditions.requestedLoanAmount)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">적용금리</dt>
                <dd className="font-medium text-gray-900">{conditions.appliedRatePercent.toFixed(2)}%</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">스트레스금리</dt>
                <dd className="font-medium text-gray-900">{conditions.stressRatePercent.toFixed(2)}%p</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-600">목표 RTI</dt>
                <dd className="font-medium text-gray-900">{conditions.targetRTI.toFixed(2)}배</dd>
              </div>
            </dl>

            <fieldset className="mt-5">
              <legend className="text-xs font-semibold text-gray-500">반올림 방식</legend>
              <div className="mt-2 flex flex-wrap gap-3">
                {(
                  [
                    ['round', '반올림'],
                    ['floor', '절사'],
                    ['ceil', '올림'],
                  ] as const
                ).map(([mode, label]) => (
                  <label key={mode} className="inline-flex items-center gap-1.5 text-sm text-gray-800">
                    <input
                      type="radio"
                      name="showcase-rounding"
                      checked={roundingMode === mode}
                      onChange={() => setRoundingMode(mode)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="rounded-xl border border-gold-200 bg-gold-50 p-5">
            <h3 className="text-base font-semibold text-gray-900">예시 결과</h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-700">현재 RTI</dt>
                <dd className="font-semibold text-gray-900">
                  {result.currentRTI === null ? '-' : `${result.currentRTI.toFixed(2)}배`}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-700">최대 대출금액</dt>
                <dd className="font-semibold text-gray-900">{formatEok(result.roundedMaxLoanByRTI)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-700">필요 월세</dt>
                <dd className="font-semibold text-gray-900">{formatWon(result.requiredMonthlyRent)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-700">목표 RTI 충족</dt>
                <dd className="font-semibold text-gray-900">
                  {result.isRTISatisfied === null ? '판정 불가' : result.isRTISatisfied ? '충족' : '미충족'}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs leading-relaxed text-gray-700">{analysis}</p>
            <button
              type="button"
              onClick={handleCsvDownload}
              className="mt-5 inline-flex min-h-10 items-center rounded-md bg-gold-500 px-3 py-2 text-sm font-semibold text-white hover:bg-gold-600"
            >
              CSV 저장
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200">
          <table className="min-w-full text-left text-sm">
            <caption className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-left font-semibold text-gray-900">
              월세별 예상 대출금액 (예시 구간)
            </caption>
            <thead className="bg-white">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium text-gray-600">
                  월 임대료
                </th>
                <th scope="col" className="px-4 py-2 font-medium text-gray-600">
                  최대 대출금액
                </th>
              </tr>
            </thead>
            <tbody>
              {rentExamples.map((row) => (
                <tr key={row.monthlyRent} className="border-t border-gray-100">
                  <td className="px-4 py-2 text-gray-800">{formatWon(row.monthlyRent)}</td>
                  <td className="px-4 py-2 text-gray-800">{formatEok(row.roundedMaxLoan)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          실제 AI Agent는 Access Code 인증 후 사용할 수 있습니다.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="#demo"
            className="inline-flex min-h-11 items-center rounded-md bg-gold-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold-600"
          >
            정적 데모 체험하기
          </a>
          <a
            href="/"
            className="inline-flex min-h-11 items-center rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 hover:border-gold-400 hover:bg-gold-50"
          >
            인증 후 실제 Agent 사용
          </a>
        </div>
      </div>
    </section>
  );
}
