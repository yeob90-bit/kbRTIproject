interface AnalysisSummaryProps {
  text: string;
}

export function AnalysisSummary({ text }: AnalysisSummaryProps) {
  return (
    <section aria-labelledby="analysis-heading" className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <h2 id="analysis-heading" className="text-base font-semibold text-gray-900">
        AI Agent의 분석의견
      </h2>
      <p className="mt-1 text-xs text-gray-400">아래 문구는 AI가 아닌 계산엔진 결과를 그대로 사용하여 코드로 생성됩니다.</p>
      <p className="mt-3 whitespace-pre-line rounded-md bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-800">
        {text}
      </p>
    </section>
  );
}
