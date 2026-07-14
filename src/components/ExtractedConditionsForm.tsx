import type { ReactNode } from 'react';
import type { BorrowerType, ParsedLoanConditions } from '../types/loan';
import { BORROWER_TYPE_LABELS, REQUIRED_FIELD_LABELS } from '../types/loan';

interface ExtractedConditionsFormProps {
  conditions: ParsedLoanConditions;
  onChange: (patch: Partial<ParsedLoanConditions>) => void;
  onConfirm: () => void;
}

function numberOrEmpty(value: number | null): string {
  return value === null ? '' : String(value);
}

function parseOptionalNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ExtractedConditionsForm({ conditions, onChange, onConfirm }: ExtractedConditionsFormProps) {
  return (
    <section
      aria-labelledby="extracted-heading"
      className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
    >
      <h2 id="extracted-heading" className="text-base font-semibold text-gray-900">
        AI 추출값 확인 및 수정
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        AI가 추출한 값은 확정된 계산조건이 아닙니다. 아래에서 확인 후 필요한 값을 수정하고 계산을 진행해 주세요.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label={REQUIRED_FIELD_LABELS.monthlyRent} unit="원">
          <input
            type="number"
            inputMode="decimal"
            aria-label={REQUIRED_FIELD_LABELS.monthlyRent}
            value={numberOrEmpty(conditions.monthlyRent)}
            onChange={(e) => onChange({ monthlyRent: parseOptionalNumber(e.target.value) })}
            className="input-field"
          />
        </Field>

        <Field label={REQUIRED_FIELD_LABELS.requestedLoanAmount} unit="원">
          <input
            type="number"
            inputMode="decimal"
            aria-label={REQUIRED_FIELD_LABELS.requestedLoanAmount}
            value={numberOrEmpty(conditions.requestedLoanAmount)}
            onChange={(e) => onChange({ requestedLoanAmount: parseOptionalNumber(e.target.value) })}
            className="input-field"
          />
        </Field>

        <Field label={REQUIRED_FIELD_LABELS.appliedRatePercent} unit="%">
          <input
            type="number"
            step="0.01"
            aria-label={REQUIRED_FIELD_LABELS.appliedRatePercent}
            value={numberOrEmpty(conditions.appliedRatePercent)}
            onChange={(e) => onChange({ appliedRatePercent: parseOptionalNumber(e.target.value) })}
            className="input-field"
          />
        </Field>

        <Field label={REQUIRED_FIELD_LABELS.stressRatePercent} unit="%p">
          <input
            type="number"
            step="0.01"
            aria-label={REQUIRED_FIELD_LABELS.stressRatePercent}
            value={numberOrEmpty(conditions.stressRatePercent)}
            onChange={(e) => onChange({ stressRatePercent: parseOptionalNumber(e.target.value) })}
            className="input-field"
          />
        </Field>

        <Field label={REQUIRED_FIELD_LABELS.targetRTI} unit="배">
          <input
            type="number"
            step="0.01"
            aria-label={REQUIRED_FIELD_LABELS.targetRTI}
            value={numberOrEmpty(conditions.targetRTI)}
            onChange={(e) => onChange({ targetRTI: parseOptionalNumber(e.target.value) })}
            className="input-field"
          />
        </Field>

        <Field label="차주 유형">
          <select
            aria-label="차주 유형"
            value={conditions.borrowerType}
            onChange={(e) => onChange({ borrowerType: e.target.value as BorrowerType })}
            className="input-field !text-left"
          >
            {Object.entries(BORROWER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="매매가" unit="원">
          <input
            type="number"
            inputMode="decimal"
            aria-label="매매가"
            value={numberOrEmpty(conditions.propertyPrice)}
            onChange={(e) => onChange({ propertyPrice: parseOptionalNumber(e.target.value) })}
            className="input-field"
          />
        </Field>

        <Field label="담보평가액" unit="원">
          <input
            type="number"
            inputMode="decimal"
            aria-label="담보평가액"
            value={numberOrEmpty(conditions.collateralValue)}
            onChange={(e) => onChange({ collateralValue: parseOptionalNumber(e.target.value) })}
            className="input-field"
          />
        </Field>

        <Field label="LTV" unit="%">
          <input
            type="number"
            step="0.01"
            aria-label="LTV"
            value={numberOrEmpty(conditions.ltvPercent)}
            onChange={(e) => onChange({ ltvPercent: parseOptionalNumber(e.target.value) })}
            className="input-field"
          />
        </Field>
      </div>

      {(conditions.missingFields.length > 0 || conditions.warnings.length > 0) && (
        <div className="mt-4 space-y-2">
          {conditions.missingFields.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span className="font-semibold">누락된 필수항목: </span>
              {conditions.missingFields.join(', ')}
            </div>
          )}
          {conditions.warnings.length > 0 && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <span className="font-semibold">AI 경고사항: </span>
              {conditions.warnings.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
        >
          이 조건으로 계산
        </button>
      </div>
    </section>
  );
}

function Field({ label, unit, children }: { label: string; unit?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {unit ? <span className="ml-1 text-xs text-gray-400">({unit})</span> : null}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
