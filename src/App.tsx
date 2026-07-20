import { useCallback, useMemo, useState } from 'react';
import { NaturalLanguageInput } from './components/NaturalLanguageInput';
import { ExtractedConditionsForm } from './components/ExtractedConditionsForm';
import { ManualInputForm } from './components/ManualInputForm';
import { ResultCards } from './components/ResultCards';
import { CalculationDetailTable } from './components/CalculationDetailTable';
import { RentLoanExampleTable } from './components/RentLoanExampleTable';
import { AnalysisSummary } from './components/AnalysisSummary';
import { PrivacyWarning } from './components/PrivacyWarning';
import { ChatPanel } from './components/chat/ChatPanel';
import type { ToolResultEvent } from './components/chat/types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { calculateRTI, createRentLoanExamples } from './utils/calculations';
import { generateAnalysisSummary } from './utils/analysis';
import { checkPrivacyRisk, PRIVACY_WARNING_MESSAGE } from './utils/privacy';
import { validateStoredRateSettings } from './utils/validation';
import { downloadCsv } from './utils/csv';
import { parseLoanConditions, LoanParserApiError } from './services/loanParserApi';
import type { BorrowerType, LoanConditions, ParsedLoanConditions, RoundingMode } from './types/loan';

const DEFAULT_RTI_SETTINGS = {
  monthlyRent: 20_000_000,
  requestedLoanAmount: 3_810_000_000,
  appliedRatePercent: 4.1,
  stressRatePercent: 2.0,
  targetRTI: 1.5,
  borrowerType: 'corporate' as const,
};

interface RateSettings {
  appliedRatePercent: number;
  stressRatePercent: number;
  targetRTI: number;
  startMonthlyRent: number;
  endMonthlyRent: number;
  rentStep: number;
  roundingMode: RoundingMode;
}

const DEFAULT_RATE_SETTINGS: RateSettings = {
  appliedRatePercent: DEFAULT_RTI_SETTINGS.appliedRatePercent,
  stressRatePercent: DEFAULT_RTI_SETTINGS.stressRatePercent,
  targetRTI: DEFAULT_RTI_SETTINGS.targetRTI,
  startMonthlyRent: 1_000_000,
  endMonthlyRent: 30_000_000,
  rentStep: 1_000_000,
  roundingMode: 'round',
};

type CaseInputs = Pick<
  LoanConditions,
  'monthlyRent' | 'requestedLoanAmount' | 'borrowerType' | 'propertyPrice' | 'collateralValue' | 'ltvPercent'
>;

const DEFAULT_CASE_INPUTS: CaseInputs = {
  monthlyRent: DEFAULT_RTI_SETTINGS.monthlyRent,
  requestedLoanAmount: DEFAULT_RTI_SETTINGS.requestedLoanAmount,
  borrowerType: DEFAULT_RTI_SETTINGS.borrowerType,
  propertyPrice: null,
  collateralValue: null,
  ltvPercent: null,
};

const EMPTY_PARSED_CONDITIONS: ParsedLoanConditions = {
  monthlyRent: null,
  requestedLoanAmount: null,
  appliedRatePercent: null,
  stressRatePercent: null,
  targetRTI: null,
  borrowerType: 'unknown',
  propertyPrice: null,
  collateralValue: null,
  ltvPercent: null,
  missingFields: [],
  warnings: [],
};

const RATE_SETTINGS_STORAGE_KEY = 'kbRtiAgent.rateSettings.v1';

interface AppProps {
  onLogout?: () => void;
}

function App({ onLogout }: AppProps) {
  const [caseInputs, setCaseInputs] = useState<CaseInputs>(DEFAULT_CASE_INPUTS);
  const [rateSettings, setRateSettings, resetRateSettings] = useLocalStorage<RateSettings>(
    RATE_SETTINGS_STORAGE_KEY,
    DEFAULT_RATE_SETTINGS,
    (value) => validateStoredRateSettings(value).valid,
  );

  const [naturalLanguageText, setNaturalLanguageText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [parsedConditions, setParsedConditions] = useState<ParsedLoanConditions | null>(null);

  const loanConditions: LoanConditions = useMemo(
    () => ({
      ...caseInputs,
      appliedRatePercent: rateSettings.appliedRatePercent,
      stressRatePercent: rateSettings.stressRatePercent,
      targetRTI: rateSettings.targetRTI,
    }),
    [caseInputs, rateSettings],
  );

  const result = useMemo(
    () => calculateRTI(loanConditions, rateSettings.roundingMode),
    [loanConditions, rateSettings.roundingMode],
  );

  const analysisText = useMemo(
    () => generateAnalysisSummary(result, loanConditions.targetRTI, loanConditions.requestedLoanAmount),
    [result, loanConditions.targetRTI, loanConditions.requestedLoanAmount],
  );

  const rentExamples = useMemo(
    () =>
      createRentLoanExamples({
        startMonthlyRent: rateSettings.startMonthlyRent,
        endMonthlyRent: rateSettings.endMonthlyRent,
        rentStep: rateSettings.rentStep,
        appliedRatePercent: rateSettings.appliedRatePercent,
        stressRatePercent: rateSettings.stressRatePercent,
        targetRTI: rateSettings.targetRTI,
        roundingMode: rateSettings.roundingMode,
      }),
    [rateSettings],
  );

  const handleConditionsChange = useCallback((patch: Partial<LoanConditions>) => {
    const { appliedRatePercent, stressRatePercent, targetRTI, ...caseRest } = patch;
    const rateDiff: Partial<RateSettings> = {};
    if (appliedRatePercent !== undefined) rateDiff.appliedRatePercent = appliedRatePercent;
    if (stressRatePercent !== undefined) rateDiff.stressRatePercent = stressRatePercent;
    if (targetRTI !== undefined) rateDiff.targetRTI = targetRTI;

    if (Object.keys(rateDiff).length > 0) {
      setRateSettings((prev) => ({ ...prev, ...rateDiff }));
    }
    if (Object.keys(caseRest).length > 0) {
      setCaseInputs((prev) => ({ ...prev, ...caseRest }));
    }
  }, [setRateSettings]);

  async function handleExtract() {
    setAiError(null);

    const privacyCheck = checkPrivacyRisk(naturalLanguageText);
    if (privacyCheck.hasSensitiveInfo) {
      setAiError(PRIVACY_WARNING_MESSAGE);
      return;
    }

    setAiLoading(true);
    try {
      const parsed = await parseLoanConditions(naturalLanguageText);
      setParsedConditions(parsed);
    } catch (error) {
      if (error instanceof LoanParserApiError) {
        setAiError(error.message);
      } else {
        setAiError('알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setAiLoading(false);
    }
  }

  function handleParsedConditionsChange(patch: Partial<ParsedLoanConditions>) {
    setParsedConditions((prev) => ({ ...(prev ?? EMPTY_PARSED_CONDITIONS), ...patch }));
  }

  function handleConfirmParsedConditions() {
    if (!parsedConditions) return;

    setCaseInputs((prev) => ({
      monthlyRent: parsedConditions.monthlyRent ?? prev.monthlyRent,
      requestedLoanAmount: parsedConditions.requestedLoanAmount ?? prev.requestedLoanAmount,
      borrowerType: parsedConditions.borrowerType ?? prev.borrowerType,
      propertyPrice: parsedConditions.propertyPrice,
      collateralValue: parsedConditions.collateralValue,
      ltvPercent: parsedConditions.ltvPercent,
    }));

    setRateSettings((prev) => ({
      ...prev,
      appliedRatePercent: parsedConditions.appliedRatePercent ?? prev.appliedRatePercent,
      stressRatePercent: parsedConditions.stressRatePercent ?? prev.stressRatePercent,
      targetRTI: parsedConditions.targetRTI ?? prev.targetRTI,
    }));
  }

  function handleResetInputs() {
    setCaseInputs(DEFAULT_CASE_INPUTS);
    setNaturalLanguageText('');
    setParsedConditions(null);
    setAiError(null);
  }

  function handleResetSettings() {
    resetRateSettings();
  }

  const handleToolResult = useCallback(
    (event: ToolResultEvent) => {
      if (event.updatedConditions) {
        const patch = event.updatedConditions as Partial<LoanConditions>;
        const nextPatch: Partial<LoanConditions> = {};

        if (typeof patch.monthlyRent === 'number') nextPatch.monthlyRent = patch.monthlyRent;
        if (typeof patch.requestedLoanAmount === 'number') nextPatch.requestedLoanAmount = patch.requestedLoanAmount;
        if (typeof patch.appliedRatePercent === 'number') nextPatch.appliedRatePercent = patch.appliedRatePercent;
        if (typeof patch.stressRatePercent === 'number') nextPatch.stressRatePercent = patch.stressRatePercent;
        if (typeof patch.targetRTI === 'number') nextPatch.targetRTI = patch.targetRTI;
        if (patch.borrowerType === 'individual' || patch.borrowerType === 'corporate' || patch.borrowerType === 'unknown') {
          nextPatch.borrowerType = patch.borrowerType as BorrowerType;
        }

        if (Object.keys(nextPatch).length > 0) {
          handleConditionsChange(nextPatch);
        }
      }

      if (event.tableSettings) {
        setRateSettings((prev) => ({
          ...prev,
          startMonthlyRent: event.tableSettings!.startMonthlyRent,
          endMonthlyRent: event.tableSettings!.endMonthlyRent,
          rentStep: event.tableSettings!.rentStep,
        }));
      }
    },
    [handleConditionsChange, setRateSettings],
  );

  function handleCsvDownload() {
    const rows: (string | number)[][] = [
      ['기업대출 RTI 분석 결과'],
      [],
      ['항목', '값'],
      ['월 임대료(원)', loanConditions.monthlyRent],
      ['대출 희망금액(원)', loanConditions.requestedLoanAmount],
      ['적용금리(%)', loanConditions.appliedRatePercent],
      ['스트레스금리(%p)', loanConditions.stressRatePercent],
      ['검토금리(%)', result.reviewRate * 100],
      ['목표 RTI(배)', loanConditions.targetRTI],
      ['현재 RTI(배)', result.currentRTI ?? ''],
      ['RTI 충족 여부', result.isRTISatisfied === null ? '판정 불가' : result.isRTISatisfied ? '충족' : '미충족'],
      ['최대 대출금액(원, 반올림 전)', result.maxLoanByRTI],
      ['최대 대출금액(원, 100만원 단위 처리)', result.roundedMaxLoanByRTI],
      ['희망금액 대비 차이(원)', result.loanDifference],
      ['필요 월세(원)', result.requiredMonthlyRent],
      [],
      ['월세별 예상 대출금액 표'],
      ['월 임대료(원)', '연간 임대료(원)', '최대 대출금액(원)'],
      ...rentExamples.map((example) => [example.monthlyRent, example.annualRent, example.roundedMaxLoan]),
    ];

    downloadCsv(`RTI분석결과_${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-16">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">기업대출 RTI 분석 AI Agent</h1>
              <p className="mt-2 text-sm text-gray-600">
                상담형 AI Agent와 대화하며 RTI를 분석하거나, 빠른 입력모드로 조건을 추출할 수 있습니다. RTI·대출한도 등 숫자
                계산은 TypeScript 계산엔진이 수행하며 AI는 직접 계산하지 않습니다.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/showcase"
                className="inline-flex min-h-10 items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:border-gold-400 hover:bg-gold-50"
              >
                Showcase
              </a>
              {onLogout && (
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  className="inline-flex min-h-10 items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:border-red-300 hover:bg-red-50"
                >
                  로그아웃
                </button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <PrivacyWarning />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <ChatPanel currentConditions={loanConditions} onToolResult={handleToolResult} />

        <details className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <summary className="cursor-pointer text-base font-semibold text-gray-900">
            빠른 입력모드 (일회성 자연어 조건 추출)
          </summary>
          <div className="mt-4 space-y-4">
            <NaturalLanguageInput
              value={naturalLanguageText}
              onChange={setNaturalLanguageText}
              onExtract={handleExtract}
              loading={aiLoading}
              error={aiError}
            />

            {parsedConditions && (
              <ExtractedConditionsForm
                conditions={parsedConditions}
                onChange={handleParsedConditionsChange}
                onConfirm={handleConfirmParsedConditions}
              />
            )}
          </div>
        </details>

        <ManualInputForm
          conditions={loanConditions}
          onChange={handleConditionsChange}
          roundingMode={rateSettings.roundingMode}
          onRoundingModeChange={(mode) => setRateSettings((prev) => ({ ...prev, roundingMode: mode }))}
        />

        <ResultCards result={result} targetRTI={loanConditions.targetRTI} />

        <CalculationDetailTable conditions={loanConditions} result={result} />

        <AnalysisSummary text={analysisText} />

        <RentLoanExampleTable
          examples={rentExamples}
          startMonthlyRent={rateSettings.startMonthlyRent}
          endMonthlyRent={rateSettings.endMonthlyRent}
          rentStep={rateSettings.rentStep}
          onRangeChange={(patch) => setRateSettings((prev) => ({ ...prev, ...patch }))}
          appliedRatePercent={rateSettings.appliedRatePercent}
          stressRatePercent={rateSettings.stressRatePercent}
          targetRTI={rateSettings.targetRTI}
          roundingMode={rateSettings.roundingMode}
        />

        <section className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900">데이터 관리</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleCsvDownload}
              className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
            >
              CSV 다운로드
            </button>
            <button
              type="button"
              onClick={handleResetInputs}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              입력 초기화
            </button>
            <button
              type="button"
              onClick={handleResetSettings}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              계산조건 초기화
            </button>
          </div>
        </section>

        <p className="text-xs leading-relaxed text-gray-400">
          면책문구: 본 화면의 계산결과는 입력된 조건을 기준으로 한 참고용 산출값이며, 실제 여신심사 결과와 다를 수 있습니다.
          최종 대출조건 및 승인 여부는 관련 규정과 심사기준에 따라 결정됩니다.
        </p>
      </main>
    </div>
  );
}

export default App;
