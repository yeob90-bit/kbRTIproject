import { useState } from 'react';
import type { BorrowerType, LoanConditions, RoundingMode } from '../types/loan';
import { BORROWER_TYPE_LABELS } from '../types/loan';
import { ROUNDING_MODE_LABELS } from '../utils/rounding';

interface ManualInputFormProps {
  conditions: LoanConditions;
  onChange: (patch: Partial<LoanConditions>) => void;
  roundingMode: RoundingMode;
  onRoundingModeChange: (mode: RoundingMode) => void;
}

/** 금액 입력값을 천단위 구분 기호가 포함된 문자열로 표시한다. */
function formatAmount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  return value.toLocaleString('ko-KR');
}

/** 천단위 구분 기호(,)나 공백 등을 제거하고 숫자만 추출한다. */
function parseAmount(raw: string): number {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits === '' ? 0 : Number(digits);
}

function parseNullableAmount(raw: string): number | null {
  const digits = raw.replace(/[^0-9]/g, '');
  return digits === '' ? null : Number(digits);
}

interface DecimalInputProps {
  id: string;
  value: number | null;
  nullable?: boolean;
  min?: number;
  onValueChange: (value: number | null) => void;
}

/** 포커스 중에는 자유롭게 입력하고, 포커스가 벗어나면(blur) 소수점 둘째자리로 정리해 표시하는 입력 필드. */
function DecimalInput({ id, value, nullable = false, min, onValueChange }: DecimalInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(() => (value === null ? '' : value.toFixed(2)));
  const [syncedValue, setSyncedValue] = useState(value);

  // 포커스가 없을 때 외부(value prop) 변경 사항을 렌더링 중에 반영한다. (참고: https://react.dev/learn/you-might-not-need-an-effect)
  if (!focused && value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value === null ? '' : value.toFixed(2));
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={draft}
      onFocus={() => setFocused(true)}
      onChange={(e) => {
        const raw = e.target.value;
        setDraft(raw);
        if (raw.trim() === '') {
          onValueChange(nullable ? null : 0);
          return;
        }
        const parsed = Number(raw);
        if (Number.isFinite(parsed)) onValueChange(parsed);
      }}
      onBlur={() => {
        setFocused(false);
        if (draft.trim() === '') {
          setDraft(nullable ? '' : (0).toFixed(2));
          onValueChange(nullable ? null : 0);
          return;
        }
        const parsed = Number(draft);
        const safe = Number.isFinite(parsed) ? parsed : 0;
        const clamped = min !== undefined ? Math.max(min, safe) : safe;
        setDraft(clamped.toFixed(2));
        onValueChange(clamped);
      }}
      className="input-field mt-1"
    />
  );
}

export function ManualInputForm({ conditions, onChange, roundingMode, onRoundingModeChange }: ManualInputFormProps) {
  return (
    <section aria-labelledby="manual-heading" className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 id="manual-heading" className="text-base font-semibold text-gray-900">
        상담내용 직접입력
      </h2>
      <p className="mt-1 text-sm text-gray-500">AI 없이도 직접 값을 입력하여 계산할 수 있습니다. 값 변경 시 결과가 즉시 갱신됩니다.</p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="manual-monthlyRent" className="block text-sm font-medium text-gray-700">
            월 임대료 <span className="text-xs text-gray-400">(원)</span>
          </label>
          <input
            id="manual-monthlyRent"
            type="text"
            inputMode="numeric"
            value={formatAmount(conditions.monthlyRent)}
            onChange={(e) => onChange({ monthlyRent: parseAmount(e.target.value) })}
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="manual-requestedLoanAmount" className="block text-sm font-medium text-gray-700">
            대출 희망금액 <span className="text-xs text-gray-400">(원)</span>
          </label>
          <input
            id="manual-requestedLoanAmount"
            type="text"
            inputMode="numeric"
            value={formatAmount(conditions.requestedLoanAmount)}
            onChange={(e) => onChange({ requestedLoanAmount: parseAmount(e.target.value) })}
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="manual-appliedRatePercent" className="block text-sm font-medium text-gray-700">
            제안금리 <span className="text-xs text-gray-400">(%)</span>
          </label>
          <DecimalInput
            id="manual-appliedRatePercent"
            value={conditions.appliedRatePercent}
            min={0}
            onValueChange={(value) => onChange({ appliedRatePercent: value ?? 0 })}
          />
        </div>

        <div>
          <label htmlFor="manual-stressRatePercent" className="block text-sm font-medium text-gray-700">
            스트레스금리 <span className="text-xs text-gray-400">(%p)</span>
          </label>
          <DecimalInput
            id="manual-stressRatePercent"
            value={conditions.stressRatePercent}
            min={0}
            onValueChange={(value) => onChange({ stressRatePercent: value ?? 0 })}
          />
        </div>

        <div>
          <label htmlFor="manual-targetRTI" className="block text-sm font-medium text-gray-700">
            목표 RTI <span className="text-xs text-gray-400">(배)</span>
          </label>
          <DecimalInput
            id="manual-targetRTI"
            value={conditions.targetRTI}
            min={0}
            onValueChange={(value) => onChange({ targetRTI: value ?? 0 })}
          />
        </div>

        <div>
          <label htmlFor="manual-borrowerType" className="block text-sm font-medium text-gray-700">
            차주 유형
          </label>
          <select
            id="manual-borrowerType"
            value={conditions.borrowerType}
            onChange={(e) => onChange({ borrowerType: e.target.value as BorrowerType })}
            className="input-field mt-1 !text-left"
          >
            {Object.entries(BORROWER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="manual-propertyPrice" className="block text-sm font-medium text-gray-700">
            매매가 <span className="text-xs text-gray-400">(원, 선택)</span>
          </label>
          <input
            id="manual-propertyPrice"
            type="text"
            inputMode="numeric"
            value={formatAmount(conditions.propertyPrice)}
            onChange={(e) => onChange({ propertyPrice: parseNullableAmount(e.target.value) })}
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="manual-collateralValue" className="block text-sm font-medium text-gray-700">
            담보평가액 <span className="text-xs text-gray-400">(원, 선택)</span>
          </label>
          <input
            id="manual-collateralValue"
            type="text"
            inputMode="numeric"
            value={formatAmount(conditions.collateralValue)}
            onChange={(e) => onChange({ collateralValue: parseNullableAmount(e.target.value) })}
            className="input-field mt-1"
          />
        </div>

        <div>
          <label htmlFor="manual-ltvPercent" className="block text-sm font-medium text-gray-700">
            LTV <span className="text-xs text-gray-400">(%, 선택)</span>
          </label>
          <DecimalInput
            id="manual-ltvPercent"
            value={conditions.ltvPercent ?? null}
            nullable
            min={0}
            onValueChange={(value) => onChange({ ltvPercent: value })}
          />
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className="text-sm font-medium text-gray-700">100만원 단위 처리 방식</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="100만원 단위 처리 방식">
          {(Object.entries(ROUNDING_MODE_LABELS) as [RoundingMode, string][]).map(([mode, label]) => (
            <label
              key={mode}
              className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm transition-colors ${
                roundingMode === mode
                  ? 'border-gold-500 bg-gold-50 text-gold-800 font-semibold'
                  : 'border-gray-300 text-gray-600 hover:border-gold-300'
              }`}
            >
              <input
                type="radio"
                name="roundingMode"
                value={mode}
                checked={roundingMode === mode}
                onChange={() => onRoundingModeChange(mode)}
                className="sr-only"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>
    </section>
  );
}
