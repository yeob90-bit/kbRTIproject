import { ErrorMessage } from './ErrorMessage';

const EXAMPLE_TEXT = '월세 2천만원이고 대출은 38억1천만원을 신청할 예정이야. 적용금리는 4.1%, 스트레스금리는 2%, 목표 RTI는 1.5배야.';

interface NaturalLanguageInputProps {
  value: string;
  onChange: (value: string) => void;
  onExtract: () => void;
  loading: boolean;
  error: string | null;
}

export function NaturalLanguageInput({ value, onChange, onExtract, loading, error }: NaturalLanguageInputProps) {
  return (
    <section
      aria-labelledby="nl-input-heading"
      className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm"
    >
      <h2 id="nl-input-heading" className="text-base font-semibold text-gray-900">
        상담내용 입력
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        상담 중 확인한 대출조건을 자연어로 입력하면 AI가 필요한 값을 추출합니다. 계산은 AI가 아닌 코드 계산엔진이 수행합니다.
      </p>

      <label htmlFor="nl-input-textarea" className="sr-only">
        자연어 대출조건 입력
      </label>
      <textarea
        id="nl-input-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`예시: ${EXAMPLE_TEXT}`}
        rows={4}
        className="mt-3 w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
      />

      <div className="mt-2 text-xs text-gray-500">
        입력 예시:{' '}
        <button
          type="button"
          onClick={() => onChange(EXAMPLE_TEXT)}
          className="underline decoration-dotted hover:text-gold-600"
        >
          {EXAMPLE_TEXT}
        </button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onExtract}
          disabled={loading || value.trim().length === 0}
          aria-busy={loading}
          className="inline-flex items-center gap-2 rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-600 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {loading ? (
            <>
              <span
                aria-hidden="true"
                className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
              AI 분석 중...
            </>
          ) : (
            'AI로 조건 추출'
          )}
        </button>
      </div>

      <div className="mt-3">
        <ErrorMessage message={error} />
      </div>
    </section>
  );
}
